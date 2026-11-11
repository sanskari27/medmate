import type { ProblemDetail } from "@/types";

function detailFrom(data: unknown): string | null {
  if (typeof data === "string") {
    try {
      return detailFrom(JSON.parse(data) as unknown);
    } catch {
      return null;
    }
  }
  if (typeof data === "object" && data && "detail" in data) {
    const detail = (data as ProblemDetail).detail;
    if (typeof detail === "string" && detail.length > 0) return detail;
  }
  return null;
}

export function problemMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "data" in error) {
    const detail = detailFrom((error as { data?: unknown }).data);
    if (detail) return detail;
  }
  return fallback;
}
