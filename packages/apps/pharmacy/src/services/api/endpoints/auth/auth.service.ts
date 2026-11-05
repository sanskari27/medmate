import { commitWrite, type WriteRequest } from "@/services/api/write";

export function authService(req: WriteRequest) {
  return commitWrite(req);
}
