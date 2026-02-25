"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Loader2, X, Upload } from "lucide-react";
import { UploadButton, UploadDropzone } from "@/lib/uploadthing";
import { updateProfileImage, addGalleryImage, deleteGalleryImage } from "@/lib/actions/profile";
import { getInitials } from "@/lib/utils";

interface ProfileImageUploadProps {
  currentImage: string | null;
  firstName: string | null;
  lastName: string | null;
  onImageUpdate?: (url: string) => void;
}

export function ProfileImageUpload({
  currentImage,
  firstName,
  lastName,
  onImageUpdate,
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImage);

  const handleUploadComplete = async (res: { url: string }[]) => {
    if (res && res[0]) {
      const url = res[0].url;
      setIsUploading(true);

      try {
        const result = await updateProfileImage(url);
        if (result.success) {
          setImageUrl(url);
          toast.success("Profile photo updated!");
          onImageUpdate?.(url);
        } else {
          toast.error(result.error || "Failed to update profile photo");
        }
      } catch {
        toast.error("Something went wrong");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="bg-brand-light relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-lg">
          {imageUrl ? (
            <Image src={imageUrl} alt="Profile" fill className="object-cover" />
          ) : (
            <div className="text-brand flex h-full w-full items-center justify-center text-3xl font-semibold">
              {getInitials(firstName, lastName)}
            </div>
          )}
        </div>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <UploadButton
        endpoint="profileImage"
        onClientUploadComplete={handleUploadComplete}
        onUploadError={(error: Error) => {
          toast.error(`Upload failed: ${error.message}`);
        }}
        appearance={{
          button: "bg-brand hover:bg-brand/90 text-white text-sm px-4 py-2 rounded-lg",
          allowedContent: "hidden",
        }}
        content={{
          button({ ready }) {
            if (ready)
              return (
                <>
                  <Camera className="mr-2 h-4 w-4" /> Change Photo
                </>
              );
            return <Loader2 className="h-4 w-4 animate-spin" />;
          },
        }}
      />
    </div>
  );
}

interface GalleryUploadProps {
  images: { id: number; imageUrl: string }[];
  onImagesUpdate?: () => void;
}

export function GalleryUpload({ images, onImagesUpdate }: GalleryUploadProps) {
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const handleUploadComplete = async (res: { url: string }[]) => {
    if (res && res.length > 0) {
      let successCount = 0;
      for (const file of res) {
        try {
          const result = await addGalleryImage(file.url);
          if (result.success) {
            successCount++;
          } else {
            toast.error(result.error || "Failed to add image");
          }
        } catch {
          toast.error("Failed to save image");
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} image${successCount > 1 ? "s" : ""} uploaded successfully!`);
      }
      onImagesUpdate?.();
    }
  };

  const handleDelete = async (imageId: number) => {
    setIsDeleting(imageId);
    try {
      const result = await deleteGalleryImage(imageId);
      if (result.success) {
        toast.success("Image deleted");
        onImagesUpdate?.();
      } else {
        toast.error(result.error || "Failed to delete image");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {images.map((image, index) => (
          <div key={image.id} className="group relative aspect-square">
            <Image
              src={image.imageUrl}
              alt={`Gallery photo ${index + 1}`}
              fill
              className="rounded-lg object-cover"
            />
            <button
              onClick={() => handleDelete(image.id)}
              disabled={isDeleting === image.id}
              aria-label={`Delete photo ${index + 1}`}
              className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
            >
              {isDeleting === image.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </button>
          </div>
        ))}

        {images.length < 5 && (
          <UploadDropzone
            endpoint="galleryImages"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={(error: Error) => {
              toast.error(`Upload failed: ${error.message}`);
            }}
            appearance={{
              container:
                "aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-brand transition-colors",
              uploadIcon: "text-muted-foreground",
              label: "text-sm text-muted-foreground",
              allowedContent: "hidden",
            }}
            content={{
              label() {
                return (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="text-muted-foreground h-8 w-8" />
                    <span className="text-muted-foreground text-sm">Add Photos</span>
                  </div>
                );
              },
            }}
          />
        )}
      </div>

      <p className="text-muted-foreground text-center text-sm">
        You can upload up to 5 photos. Max 4MB each.
      </p>
    </div>
  );
}
