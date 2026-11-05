import { commitWrite, type WriteRequest } from "@/services/api/write";

export function reportsService(req: WriteRequest) {
  return commitWrite(req);
}
