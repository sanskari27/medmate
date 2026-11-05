import { commitWrite, type WriteRequest } from "@/services/api/write";

export function uiService(req: WriteRequest) {
  return commitWrite(req);
}
