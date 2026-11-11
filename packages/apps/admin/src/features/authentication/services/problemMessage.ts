import type { ProblemDetail } from "@/types";

export function problemMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: ProblemDetail }).data;
    if (typeof data?.detail === "string" && data.detail.length > 0) return data.detail;
  }
  return fallback;
}
