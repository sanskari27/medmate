export function normalizeApiBaseUrl(value: string | undefined): string {
  return (value || "").replace(/\/$/, "");
}

export function apiBaseUrl(): string {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);
}
