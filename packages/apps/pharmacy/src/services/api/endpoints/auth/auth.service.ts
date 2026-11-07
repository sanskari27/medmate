import type { BusinessType } from "@/types";
import type {
  Advisor,
  BankAccount,
  Employee,
  InvoiceSettings,
  KioskConfig,
  PharmacyProfile,
  Plan,
  BillingCycle,
  StaffUser,
} from "@/utils";
import { api } from "@/services/api/apiClient";
import { request } from "@/services/api/request";
import type { SessionSnapshot } from "@/store/session";

export type CouponPreview = {
  code: string;
  plan: Plan;
  expiresOn: string;
  validDays: number;
  expired: boolean;
  renewsOn: string;
};

export const authService = {
  loadSession: () => api<SessionSnapshot>("/session"),
  sendOtp: (body: { phone: string; purpose?: "reset" }) =>
    request<{ delivery?: string }>("/auth/otp/send", { method: "POST", body }),
  beginLogin: (phone: string) =>
    request<{ mode: "pin" | "otp" }>("/auth/login", { method: "POST", body: { phone } }),
  verifyOtp: (body: {
    phone: string;
    code: string;
    businessType?: BusinessType;
    name?: string;
    purpose?: "reset";
  }) => request("/auth/otp/verify", { method: "POST", body }),
  pinSignIn: (body: { phone: string; pin: string }) =>
    request("/auth/pin", { method: "POST", body }),
  saveLoginPin: (body: { pin: string; confirm: string }) =>
    request("/auth/pin/set", { method: "POST", body }),
  signOut: () => request("/auth/sign-out", { method: "POST" }),
  updateProfile: (profile: PharmacyProfile) =>
    request("/pharmacy/profile", { method: "PATCH", body: profile }),
  toggleStoreOpen: () => request("/pharmacy/store-open", { method: "POST" }),
  saveInvoiceSettings: (invoice: InvoiceSettings) =>
    request("/settings/invoice", { method: "PATCH", body: invoice }),
  saveKiosk: (kiosk: KioskConfig) => request("/settings/kiosk", { method: "PATCH", body: kiosk }),
  addUser: (user: Omit<StaffUser, "id" | "lastActiveMins">) =>
    request("/users", { method: "POST", body: user }),
  updateUser: (id: string, patch: Partial<StaffUser>) =>
    request(`/users/${id}`, { method: "PATCH", body: patch }),
  requestPlan: (body: { plan: Plan; cycle: BillingCycle; kind?: "plan" | "renewal" }) =>
    request("/subscription/requests", { method: "POST", body }),
  redeemCoupon: (code: string) =>
    request("/subscription/coupons/redeem", { method: "POST", body: { code } }),
  toggleAutoRenew: () => request("/subscription", { method: "PATCH", body: { action: "toggle" } }),
  saveBankAccount: (account: Omit<BankAccount, "verified" | "addedOn">) =>
    request("/bank-account", { method: "PUT", body: account }),
  verifyBankAccount: () => request("/bank-account/verify", { method: "POST" }),
  completeSetup: () => request("/setup/complete", { method: "POST", body: {} }),
  addEmployee: (employee: Omit<Employee, "id">) =>
    request("/employees", { method: "POST", body: employee }),
  updateEmployee: (id: string, patch: Partial<Employee>) =>
    request(`/employees/${id}`, { method: "PATCH", body: patch }),
  addAdvisor: (advisor: Omit<Advisor, "id">) =>
    request("/advisors", { method: "POST", body: advisor }),
  updateAdvisor: (id: string, patch: Partial<Advisor>) =>
    request(`/advisors/${id}`, { method: "PATCH", body: patch }),
  shareWithCA: (body: { period: string; reports: string[]; advisorId: string }) =>
    request("/ca/shares", { method: "POST", body }),
  raiseTicket: (subject: string, category: string) =>
    request("/support/tickets", { method: "POST", body: { subject, category } }),
  previewCoupon: (code: string) =>
    request<CouponPreview>("/subscription/coupons/preview", { method: "POST", body: { code } }),
};
