export function subscriptionStatusLabel(lapsed: boolean, status: string) {
  return lapsed ? "expired" : status;
}
