import { api } from "@/services/api/apiClient";
import { pricingUnlocked } from "@/store/pricingFlag";

export function request<T>(
  path: string,
  init: { method?: string; body?: unknown; idempotency?: boolean; pricing?: boolean } = {},
): Promise<T> {
  return api<T>(path, { ...init, pricing: init.pricing ?? pricingUnlocked() });
}
