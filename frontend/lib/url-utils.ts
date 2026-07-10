/** Client-side URL normalization — no backend calls. */

const URL_REGEX = /^https?:\/\/[^\s]+$/i;

export function trimUrl(value: string): string {
  return value.trim();
}

export function normalizeUrlInput(value: string): string {
  let v = trimUrl(value);
  if (!v) return v;
  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }
  return v;
}

export function isValidUrl(value: string): boolean {
  try {
    const normalized = normalizeUrlInput(value);
    new URL(normalized);
    return URL_REGEX.test(normalized);
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string | null {
  try {
    return new URL(normalizeUrlInput(url)).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function faviconUrl(url: string, size = 32): string {
  const domain = extractDomain(url);
  if (!domain) return "";
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}
