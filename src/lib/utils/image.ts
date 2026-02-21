/**
 * Client-side image utilities.
 * Do NOT import from server-side code — these rely on browser Canvas APIs.
 */

/**
 * Ensures a File is in WebP format.
 * - If the file is already `image/webp` it is returned unchanged (no re-encode).
 * - Otherwise the image is drawn onto a canvas and exported as WebP at the
 *   given quality (0–1, default 0.92).
 *
 * The returned file uses a standardised name:
 *   `<original-name-without-extension>.webp`
 */
export async function convertToWebP(file: File, quality = 0.92): Promise<File> {
  if (file.type === "image/webp") return file;

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas 2D context not available"));
        return;
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("WebP conversion produced no output"));
            return;
          }
          const baseName = file.name.replace(/\.[^.]+$/, "");
          resolve(new File([blob], `${baseName}.webp`, { type: "image/webp" }));
        },
        "image/webp",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for WebP conversion"));
    };

    img.src = url;
  });
}
