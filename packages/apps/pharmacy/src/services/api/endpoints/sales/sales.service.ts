import { commitWrite, type WriteRequest } from "@/services/api/write";

export function salesService(req: WriteRequest) {
  return commitWrite(req);
}
