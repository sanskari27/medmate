import { request } from "@/services/api/request";

export const prescriptionsService = {
  approve: (id: string) => request(`/prescriptions/${id}/approve`, { method: "POST", body: {} }),
  reject: (id: string, reason?: string) =>
    request(`/prescriptions/${id}/reject`, { method: "POST", body: { reason } }),
  dispense: (id: string) => request(`/prescriptions/${id}/dispense`, { method: "POST", body: {} }),
};
