import { commitWrite, type WriteRequest } from "@/services/api/write";

export function ordersService(req: WriteRequest) {
  return commitWrite(req);
}
