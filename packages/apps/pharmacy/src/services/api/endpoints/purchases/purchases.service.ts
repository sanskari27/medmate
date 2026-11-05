import { commitWrite, type WriteRequest } from "@/services/api/write";

export function purchasesService(req: WriteRequest) {
  return commitWrite(req);
}
