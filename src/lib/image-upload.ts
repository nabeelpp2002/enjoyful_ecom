const DEFAULT_UPLOAD_URL = "/api/admin/upload";

// Vercel Functions reject request bodies above 4.5 MB. Leave enough room for
// multipart headers by keeping the compressed image at or below 4 MB.
const MAX_UPLOAD_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_IMAGE_DIMENSION = 2560;
const COMPRESSION_QUALITIES = [0.85, 0.7, 0.55];

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Image compression failed")),
      "image/webp",
      quality,
    );
  });
}

async function compressImageForUpload(file: Blob): Promise<Blob> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose a valid image file");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image format is not supported. Please use JPG, PNG, WEBP, or AVIF.");
  }

  try {
    const initialScale = Math.min(
      1,
      MAX_UPLOAD_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    // Avoid an unnecessary lossy re-encode when the file is already suitable.
    if (
      initialScale === 1 &&
      file.size <= MAX_UPLOAD_IMAGE_BYTES &&
      (file.type === "image/jpeg" || file.type === "image/webp")
    ) {
      return file;
    }

    let width = Math.max(1, Math.round(bitmap.width * initialScale));
    let height = Math.max(1, Math.round(bitmap.height * initialScale));

    // Lower quality first, then reduce dimensions for unusually detailed images.
    for (let resizePass = 0; resizePass < 4; resizePass += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not prepare this image");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      context.drawImage(bitmap, 0, 0, width, height);

      for (const quality of COMPRESSION_QUALITIES) {
        const compressed = await canvasToBlob(canvas, quality);
        if (compressed.size <= MAX_UPLOAD_IMAGE_BYTES) return compressed;
      }

      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
    }
  } finally {
    bitmap.close();
  }

  throw new Error("This image is still too large after compression. Please use a smaller image.");
}

function filenameForBlob(filename: string | undefined, blob: Blob): string {
  const base = (filename ?? "upload").replace(/\.[^/.]+$/, "");
  if (blob.type === "image/webp") return base + ".webp";
  if (blob.type === "image/jpeg") return base + ".jpg";
  if (blob.type === "image/png") return base + ".png";
  return filename ?? "upload";
}

export async function uploadImageFile(
  file: Blob,
  filename?: string,
  uploadUrl = DEFAULT_UPLOAD_URL,
): Promise<string> {
  const compressedFile = await compressImageForUpload(file);
  const fd = new FormData();
  fd.append("file", compressedFile, filenameForBlob(filename, compressedFile));

  const res = await fetch(uploadUrl, { method: "POST", body: fd });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    if (res.status === 413) {
      throw new Error("The image is too large to upload, even after compression. Please use a smaller image.");
    }
    throw new Error(
      (errBody as { error?: { message?: string } })?.error?.message ??
        "Upload failed (HTTP " + res.status + ")",
    );
  }

  const data = await res.json();
  const url = data?.secure_url ?? data?.url ?? data?.data?.url;
  if (!url) throw new Error("Upload succeeded but no URL returned");
  return url as string;
}
