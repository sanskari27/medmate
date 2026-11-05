import { commitWrite, type WriteRequest } from "@/services/api/write";

export function crmService(req: WriteRequest) {
  return commitWrite(req);
}
