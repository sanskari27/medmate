import { api } from "@/services/api/apiClient";

export type WriteRequest = {
  path: string;
  method?: string;
  body?: unknown;
  idempotency?: boolean;
  pricing?: boolean;
};

export function commitWrite<T>(req: WriteRequest): Promise<T> {
  return api<T>(req.path, {
    method: req.method,
    body: req.body,
    idempotency: req.idempotency,
    pricing: req.pricing,
  });
}
