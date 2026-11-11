import { apiBaseUrl } from "@/services/api";

export function supportSocketUrl(): string {
  const base = apiBaseUrl();
  if (!base) {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/support/stream`;
  }
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/support/stream";
  url.search = "";
  url.hash = "";
  return url.toString();
}
