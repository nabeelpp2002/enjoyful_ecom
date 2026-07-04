const DEFAULT_UPLOAD_URL = "/api/admin/upload";

export async function uploadImageFile(
  file: Blob,
  filename?: string,
  uploadUrl = DEFAULT_UPLOAD_URL,
): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, filename ?? "upload.png");

  const res = await fetch(uploadUrl, { method: "POST", body: fd });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(
      (errBody as { error?: { message?: string } })?.error?.message ??
        `Upload failed (HTTP ${res.status})`,
    );
  }

  const data = await res.json();
  const url = data?.secure_url ?? data?.url ?? data?.data?.url;
  if (!url) throw new Error("Upload succeeded but no URL returned");
  return url as string;
}
