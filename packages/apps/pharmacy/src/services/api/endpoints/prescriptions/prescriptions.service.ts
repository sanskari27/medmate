import { commitWrite, type WriteRequest } from "@/services/api/write";

export function prescriptionsService(req: WriteRequest) {
  return commitWrite(req);
}
