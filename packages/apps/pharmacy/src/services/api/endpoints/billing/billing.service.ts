import { commitWrite, type WriteRequest } from "@/services/api/write";

export function billingService(req: WriteRequest) {
  return commitWrite(req);
}
