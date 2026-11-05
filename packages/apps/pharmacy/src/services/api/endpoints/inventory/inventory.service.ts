import { commitWrite, type WriteRequest } from "@/services/api/write";

export function inventoryService(req: WriteRequest) {
  return commitWrite(req);
}
