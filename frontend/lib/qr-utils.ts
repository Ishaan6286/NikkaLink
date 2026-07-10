import { getApiUrl } from "@/lib/env";

/** Fetch a QR code PNG from the public API and return a blob URL for display/download. */
export async function fetchQrBlobUrl(targetUrl: string): Promise<string> {
  const res = await fetch(
    `${getApiUrl()}/api/v1/urls/qr/generate?url=${encodeURIComponent(targetUrl)}`
  );
  if (!res.ok) {
    throw new Error("QR generation failed");
  }
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export function revokeQrBlobUrl(blobUrl: string | null): void {
  if (blobUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(blobUrl);
  }
}
