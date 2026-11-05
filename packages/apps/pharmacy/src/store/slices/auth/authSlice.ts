import {
  DEFAULT_INVOICE_SETTINGS,
  DEFAULT_KIOSK,
  DEFAULT_SUBSCRIPTION,
  type Advisor,
  type BankAccount,
  type CAShare,
  type Employee,
  type InvoiceSettings,
  type KioskConfig,
  type PharmacyProfile,
  type ScreenGrant,
  type StaffUser,
  type SubRequest,
  type Subscription,
} from "@/utils";
import type { BusinessType } from "@/types";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export const BLANK_PROFILE: PharmacyProfile = {
  name: "",
  tagline: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  gstRegistered: false,
  gstin: "",
  eInvoicing: false,
  pan: "",
  dlNo: "",
  fssai: "",
  tradeNo: "",
  enableTDS: false,
  enableTCS: false,
  businessTypes: [],
  industryType: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  extraDetails: [],
  storeOpen: false,
  pharmacist: "",
};

export type AuthState = {
  signedIn: boolean;
  needsPin: boolean;
  pinReset: boolean;
  impersonator: string | null;
  businessType: BusinessType;
  setupComplete: boolean;
  me: { id: string; role: string; permissions: string[] } | null;
  hydrated: boolean;
  users: StaffUser[];
  subscription: Subscription;
  grants: ScreenGrant[];
  extraSeats: number;
  subscriptionRequests: SubRequest[];
  couponRedeemed: boolean;
  profile: PharmacyProfile;
  bankAccount: BankAccount | null;
  invoiceSettings: InvoiceSettings;
  kiosk: KioskConfig;
  advisors: Advisor[];
  caShares: CAShare[];
  employees: Employee[];
};

const authSlice = createFieldSlice<AuthState>("auth", {
  signedIn: false,
  needsPin: false,
  pinReset: false,
  impersonator: null,
  businessType: "pharmacy",
  setupComplete: false,
  me: null,
  hydrated: false,
  users: [],
  subscription: { ...DEFAULT_SUBSCRIPTION, since: "" },
  grants: [],
  extraSeats: 0,
  subscriptionRequests: [],
  couponRedeemed: false,
  profile: BLANK_PROFILE,
  bankAccount: null,
  invoiceSettings: { ...DEFAULT_INVOICE_SETTINGS, bankLine: "" },
  kiosk: { ...DEFAULT_KIOSK, enabled: false, displayName: "", pin: "", welcome: "" },
  advisors: [],
  caShares: [],
  employees: [],
});

export const setAuthField = authSlice.actions.setField;
export const authReducer = authSlice.reducer;
