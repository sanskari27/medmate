const ZONES = ["nammamedmate.com", "medmatepharmacy.com"];

export function isAllowedOrigin(origin: string): boolean {
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (url.protocol === "http:" && host === "localhost") {
    return true;
  }
  if (url.protocol !== "https:") {
    return false;
  }
  return ZONES.some((zone) => host === zone || host.endsWith(`.${zone}`));
}

export function corsHeaders(origin: string | undefined): Record<string, string> {
  if (!origin || !isAllowedOrigin(origin)) {
    return {};
  }
  return {
    "access-control-allow-origin": origin,
    vary: "Origin",
    "access-control-allow-methods": "GET, OPTIONS",
    "access-control-allow-headers": "Content-Type",
  };
}
