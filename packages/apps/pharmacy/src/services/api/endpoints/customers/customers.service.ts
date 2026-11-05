import { commitWrite, type WriteRequest } from "@/services/api/write";

export function customersService(req: WriteRequest) {
  return commitWrite(req);
}
