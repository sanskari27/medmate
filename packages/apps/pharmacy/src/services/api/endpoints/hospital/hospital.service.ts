import { commitWrite, type WriteRequest } from "@/services/api/write";

export function hospitalService(req: WriteRequest) {
  return commitWrite(req);
}
