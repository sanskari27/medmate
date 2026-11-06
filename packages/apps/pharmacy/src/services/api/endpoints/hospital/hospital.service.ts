import type {
  Admission,
  ClaimStatus,
  Department,
  DoctorProfile,
  HospitalAccount,
  HospitalPayment,
  IndentStatus,
  PriceRule,
  Ward,
  WardSupply,
} from "@/utils";
import { request } from "@/services/api/request";

export const hospitalService = {
  setIndentStatus: (id: string, status: IndentStatus) =>
    request(`/hospital/indents/${id}`, { method: "PATCH", body: { status } }),
  setClaimStatus: (id: string, status: ClaimStatus, approvedAmount?: number) =>
    request(`/hospital/tpa-claims/${id}`, { method: "PATCH", body: { status, approvedAmount } }),
  addWard: (ward: Omit<Ward, "id">) => request("/hospital/wards", { method: "POST", body: ward }),
  updateWard: (id: string, patch: Partial<Ward>) =>
    request(`/hospital/wards/${id}`, { method: "PATCH", body: patch }),
  admitPatient: (admission: Omit<Admission, "id" | "admittedAt" | "status">) =>
    request<Admission>("/hospital/admissions", { method: "POST", body: admission }),
  updateAdmission: (id: string, patch: Partial<Admission>) =>
    request(`/hospital/admissions/${id}`, { method: "PATCH", body: patch }),
  dischargePatient: (id: string) =>
    request(`/hospital/admissions/${id}`, { method: "PATCH", body: { status: "discharged" } }),
  updateHospitalAccount: (patch: Partial<HospitalAccount>) =>
    request("/hospital/account", { method: "PATCH", body: patch }),
  unlockPricing: (otp: string) =>
    request("/hospital/pricing/unlock", { method: "POST", body: { code: otp }, pricing: false }),
  setUniformDiscount: (discountPct: number) =>
    request("/hospital/pricing/rules", { method: "PATCH", body: { discountPct } }),
  setHospitalPriceRule: (productId: string, rule: PriceRule) =>
    request("/hospital/pricing/rules", { method: "PATCH", body: { productId, rule } }),
  issueWardSupply: (draft: Omit<WardSupply, "id" | "kind" | "at" | "total">) =>
    request("/hospital/ward-supplies/issue", { method: "POST", body: draft, idempotency: true }),
  returnWardSupply: (draft: Omit<WardSupply, "id" | "kind" | "at" | "total">) =>
    request("/hospital/ward-supplies/return", { method: "POST", body: draft, idempotency: true }),
  recordHospitalPayment: (payment: Omit<HospitalPayment, "id" | "at">) =>
    request("/hospital/payments", { method: "POST", body: payment, idempotency: true }),
  addDoctor: (doctor: Omit<DoctorProfile, "id">) =>
    request("/hospital/doctors", { method: "POST", body: doctor }),
  updateDoctor: (id: string, patch: Partial<DoctorProfile>) =>
    request(`/hospital/doctors/${id}`, { method: "PATCH", body: patch }),
  addDepartment: (department: {
    name: string;
    head: string;
    type: Department["type"];
    emoji?: string;
  }) => request("/hospital/departments", { method: "POST", body: department }),
  updateDepartment: (id: string, patch: Partial<Department>) =>
    request(`/hospital/departments/${id}`, { method: "PATCH", body: patch }),
};
