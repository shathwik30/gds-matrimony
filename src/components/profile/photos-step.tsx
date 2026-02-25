"use client";

import { useState, useCallback, useRef, useTransition } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Loader2, X, Upload, ImagePlus, Star, GripVertical } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";
import {
  updateProfileImage,
  addGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
} from "@/lib/actions/profile";
import { ImageCropAdjuster } from "@/components/ui/image-crop-adjuster";
import { getBlurDataURL, pluralize } from "@/lib/utils";
import { convertToWebP } from "@/lib/utils/image";
import { Button } from "@/components/ui/button";

interface PhotosStepProps {
  data: Record<string, unknown>;
  onUpdate: (data: Record<string, unknown>) => void;
  onImagesChange?: () => void;
}

type CropMode = "profile" | "gallery";

function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Please select an image file";
  if (file.size > 4 * 1024 * 1024) return `${file.name} exceeds the 4 MB limit`;
  return null;
}

export function PhotosStep({ data, onUpdate, onImagesChange }: PhotosStepProps) {
  const profileImage = (data.profileImage as string) || null;
  const galleryImages = (data.images as { id: number; imageUrl: string }[]) || [];

  const [currentProfileImage, setCurrentProfileImage] = useState(profileImage);
  const [currentGalleryImages, setCurrentGalleryImages] = useState(galleryImages);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const [cropMode, setCropMode] = useState<CropMode | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [pendingCrops, setPendingCrops] = useState<File[]>([]);

  const { update: updateSession } = useSession();

  const profileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { startUpload: startProfileUpload } = useUploadThing("profileImage");
  const { startUpload: startGalleryUpload } = useUploadThing("galleryImages");

  const doUploadProfile = useCallback(
    async (file: File) => {
      setIsUploadingProfile(true);
      try {
        const webpFile = await convertToWebP(file);
        const res = await startProfileUpload([webpFile]);
        if (res?.[0]) {
          const url = res[0].ufsUrl;
          const result = await updateProfileImage(url);
          if (result.success) {
            setCurrentProfileImage(url);
            onUpdate({ ...data, profileImage: url });
            await updateSession({ image: url });
            toast.success("Profile photo updated!");
          } else {
            toast.error(result.error || "Failed to update profile photo");
          }
        }
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploadingProfile(false);
      }
    },
    [data, onUpdate, startProfileUpload, updateSession]
  );

  const doUploadGallery = useCallback(
    async (files: File[]) => {
      setIsUploadingGallery(true);
      try {
        const webpFiles = await Promise.all(files.map((f) => convertToWebP(f)));
        const res = await startGalleryUpload(webpFiles);
        if (res && res.length > 0) {
          let successCount = 0;
          const newImages: { id: number; imageUrl: string }[] = [];
          for (const uploaded of res) {
            const result = await addGalleryImage(uploaded.ufsUrl);
            if (result.success && result.data) {
              successCount++;
              newImages.push({
                id: (result.data as { id: number }).id,
                imageUrl: uploaded.ufsUrl,
              });
            }
          }
          if (successCount > 0) {
            const updated = [...currentGalleryImages, ...newImages];
            setCurrentGalleryImages(updated);
            onUpdate({ ...data, images: updated });
            toast.success(`${successCount} ${pluralize("photo", successCount)} uploaded!`);
            onImagesChange?.();
          }
        }
      } catch {
        toast.error("Upload failed. Please try again.");
      } finally {
        setIsUploadingGallery(false);
      }
    },
    [currentGalleryImages, data, onUpdate, startGalleryUpload, onImagesChange]
  );

  const handleProfileImageSelect = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const err = validateImageFile(file);
    if (err) {
      toast.error(err);
      return;
    }
    setCropMode("profile");
    setCropQueue([file]);
    setPendingCrops([]);
  }, []);

  const handleGallerySelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remainingSlots = 5 - currentGalleryImages.length;
      if (remainingSlots <= 0) {
        toast.error("Maximum 5 gallery photos allowed");
        return;
      }

      const candidates = Array.from(files).slice(0, remainingSlots);
      for (const f of candidates) {
        const err = validateImageFile(f);
        if (err) {
          toast.error(err);
          return;
        }
      }

      setCropMode("gallery");
      setCropQueue(candidates);
      setPendingCrops([]);
    },
    [currentGalleryImages.length]
  );

  const handleCropConfirm = useCallback(
    async (croppedFile: File) => {
      if (cropMode === "profile") {
        setCropMode(null);
        setCropQueue([]);
        await doUploadProfile(croppedFile);
      } else {
        const remaining = cropQueue.slice(1);
        const collected = [...pendingCrops, croppedFile];

        if (remaining.length > 0) {
          setCropQueue(remaining);
          setPendingCrops(collected);
        } else {
          setCropMode(null);
          setCropQueue([]);
          setPendingCrops([]);
          await doUploadGallery(collected);
        }
      }
    },
    [cropMode, cropQueue, pendingCrops, doUploadProfile, doUploadGallery]
  );

  const handleCropCancel = useCallback(() => {
    setCropMode(null);
    setCropQueue([]);
    setPendingCrops([]);
  }, []);

  const handleDeleteGallery = async (imageId: number) => {
    setDeletingId(imageId);
    try {
      const result = await deleteGalleryImage(imageId);
      if (result.success) {
        const updated = currentGalleryImages.filter((img) => img.id !== imageId);
        setCurrentGalleryImages(updated);
        onUpdate({ ...data, images: updated });
        toast.success("Photo removed");
        onImagesChange?.();
      } else {
        toast.error(result.error || "Failed to delete photo");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOverItem = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIndex(index);
  };

  const handleDropItem = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragIndex(null);
    setDragOverIndex(null);

    if (dragIndex === null || dragIndex === dropIndex) return;

    const reordered = [...currentGalleryImages];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setCurrentGalleryImages(reordered);
    onUpdate({ ...data, images: reordered });

    startTransition(async () => {
      const result = await reorderGalleryImages(
        reordered.map((img, i) => ({ id: img.id, sortOrder: i }))
      );
      if (!result.success) {
        toast.error("Failed to save image order");
        setCurrentGalleryImages(currentGalleryImages);
        onUpdate({ ...data, images: currentGalleryImages });
      }
    });
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleGallerySelect(e.dataTransfer.files);
  };

  const queueIndex = pendingCrops.length;
  const totalInBatch = pendingCrops.length + cropQueue.length;

  return (
    <div className="space-y-8">
      {cropMode && cropQueue.length > 0 && (
        <ImageCropAdjuster
          file={cropQueue[0]}
          aspectRatio={cropMode === "profile" ? 1 : 3 / 4}
          outputWidth={cropMode === "profile" ? 800 : 600}
          outputHeight={cropMode === "profile" ? 800 : 800}
          namePrefix={cropMode === "profile" ? "profile" : `gallery-${queueIndex}`}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}

      {cropMode === "gallery" && totalInBatch > 1 && cropQueue.length > 0 && (
        <p className="text-muted-foreground text-center text-sm">
          Adjusting photo {queueIndex + 1} of {totalInBatch}
        </p>
      )}

      <div>
        <h3 className="mb-1 text-lg font-semibold">Profile Photo</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          This is your main photo that others will see first. Choose a clear, recent photo of
          yourself.
        </p>

        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <div className="group relative">
            <div className="from-brand-light to-brand/10 border-brand/30 relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-dashed bg-gradient-to-br shadow-lg">
              {currentProfileImage ? (
                <Image
                  src={currentProfileImage}
                  alt="Profile"
                  fill
                  placeholder="blur"
                  blurDataURL={getBlurDataURL(160, 160)}
                  className="object-cover"
                />
              ) : (
                <div className="text-brand flex h-full w-full flex-col items-center justify-center gap-2">
                  <Camera className="h-10 w-10 opacity-50" />
                  <span className="text-xs font-medium opacity-60">No photo</span>
                </div>
              )}

              {isUploadingProfile && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              )}

              {!isUploadingProfile && (
                <button
                  type="button"
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100"
                >
                  <div className="text-center text-white">
                    <Camera className="mx-auto mb-1 h-6 w-6" />
                    <span className="text-xs font-medium">
                      {currentProfileImage ? "Change" : "Upload"}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {currentProfileImage && (
              <div className="absolute -top-2 -right-2 rounded-full bg-green-500 p-1 text-white shadow-md">
                <Star className="h-3.5 w-3.5 fill-white" />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 text-center sm:text-left">
            <Button
              type="button"
              variant="outline"
              onClick={() => profileInputRef.current?.click()}
              disabled={isUploadingProfile}
              className="gap-2"
            >
              {isUploadingProfile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {currentProfileImage ? "Change Photo" : "Upload Photo"}
            </Button>
            <p className="text-muted-foreground text-xs">
              JPG, PNG or WebP. Max 4MB. You&apos;ll crop before uploading.
            </p>
          </div>

          <input
            ref={profileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              handleProfileImageSelect(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="border-t" />

      <div>
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Gallery Photos</h3>
          <span className="text-muted-foreground text-sm font-medium">
            {currentGalleryImages.length}/5 photos
          </span>
        </div>
        <p className="text-muted-foreground mb-4 text-sm">
          Add up to 5 photos to showcase yourself.
          {currentGalleryImages.length > 1 && (
            <span className="text-brand/70 ml-1">Drag to reorder.</span>
          )}
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {currentGalleryImages.map((image, index) => (
            <div
              key={image.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOverItem(e, index)}
              onDrop={(e) => handleDropItem(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative aspect-[3/4] overflow-hidden rounded-xl border shadow-md transition-all select-none ${
                dragIndex === index
                  ? "scale-95 cursor-grabbing opacity-40"
                  : dragOverIndex === index
                    ? "border-brand shadow-brand/20 scale-105 border-2 shadow-lg"
                    : "border-border/50 cursor-grab hover:shadow-lg"
              }`}
            >
              <Image
                src={image.imageUrl}
                alt={`Gallery photo ${index + 1}`}
                fill
                placeholder="blur"
                blurDataURL={getBlurDataURL(160, 213)}
                className="pointer-events-none object-cover"
              />

              <div className="absolute top-2 left-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 shadow-md transition-all group-hover:opacity-100">
                <GripVertical className="h-3.5 w-3.5" />
              </div>

              <button
                type="button"
                onClick={() => handleDeleteGallery(image.id)}
                disabled={deletingId === image.id}
                aria-label={`Delete photo ${index + 1}`}
                className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 shadow-md transition-all group-hover:opacity-100 hover:bg-red-600 focus:opacity-100"
              >
                {deletingId === image.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
              </button>

              <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                {index + 1}
              </div>

              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ))}

          {Array.from({ length: Math.max(0, 5 - currentGalleryImages.length) }).map((_, i) => (
            <button
              key={`empty-${i}`}
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              disabled={isUploadingGallery}
              className="border-brand/20 hover:border-brand/50 bg-brand-light/30 hover:bg-brand-light/60 group flex aspect-[3/4] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all"
            >
              {isUploadingGallery && i === 0 ? (
                <Loader2 className="text-brand/50 h-6 w-6 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="text-brand/30 group-hover:text-brand/60 h-6 w-6 transition-colors" />
                  <span className="text-brand/40 group-hover:text-brand/70 text-xs font-medium transition-colors">
                    Add
                  </span>
                </>
              )}
            </button>
          ))}
        </div>

        {currentGalleryImages.length < 5 && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => galleryInputRef.current?.click()}
            className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              isDragging
                ? "border-brand bg-brand/5 scale-[1.01]"
                : "border-border hover:border-brand/50 hover:bg-muted/30"
            }`}
          >
            {isUploadingGallery ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="text-brand h-10 w-10 animate-spin" />
                <p className="text-brand text-sm font-medium">Uploading photos...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="bg-brand/10 flex h-14 w-14 items-center justify-center rounded-full">
                  <Upload className="text-brand h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    Drag & drop photos here, or <span className="text-brand">browse</span>
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    JPG, PNG or WebP · Max 4MB each · Crop & position before upload
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleGallerySelect(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}
