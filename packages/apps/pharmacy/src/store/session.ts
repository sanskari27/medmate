import type { BusinessType } from "@/types";
import type {
  Admission,
  Advisor,
  BankAccount,
  CAShare,
  CreditPayment,
  CrmData,
  Department,
  DoctorProfile,
  Employee,
  Expense,
  HospitalAccount,
  HospitalPayment,
  InvoiceSettings,
  InvProduct,
  KioskConfig,
  Offer,
  PharmacyProfile,
  PriceRule,
  Purchase,
  PurchaseOrder,
  Referral,
  Sale,
  ScreenGrant,
  StaffUser,
  SubRequest,
  Subscription,
  Supplier,
  SupplyEntry,
  TpaClaim,
  Ward,
  WardIndent,
  WardSupply,
} from "@/utils";
import type { Prescription } from "@/utils";

export type SessionTicket = {
  id: string;
  subject: string;
  category: string;
  status: "Open" | "Resolved";
  createdAt: number;
};

export type SessionSnapshot = {
  user?: { id: string; role: string; permissions?: string[] };
  businessType: BusinessType;
  setupComplete: boolean;
  subscription: Subscription;
  grants?: ScreenGrant[];
  extraSeats?: number;
  subscriptionRequests?: SubRequest[];
  couponRedeemed?: boolean;
  creditPayments: CreditPayment[];
  caShares: CAShare[];
  wardSupplies: WardSupply[];
  hospitalPayments: HospitalPayment[];
  tpaClaims: TpaClaim[];
  hospitalPriceRules: Record<string, PriceRule>;
  profile: PharmacyProfile;
  invoiceSettings: InvoiceSettings;
  kiosk: KioskConfig;
  inventory: InvProduct[];
  racks: string[];
  sales: Sale[];
  prescriptions: Prescription[];
  offers: Offer[];
  purchases: Purchase[];
  suppliers: Supplier[];
  supplyList: SupplyEntry[];
  purchaseOrders: PurchaseOrder[];
  expenses: Expense[];
  expenseCategories: string[];
  employees: Employee[];
  users: StaffUser[];
  bankAccount: BankAccount | null;
  advisors: Advisor[];
  crm: CrmData;
  tickets: SessionTicket[];
  referrals: Referral[];
  impersonator?: string | null;
  needsPin?: boolean;
  wards: Ward[];
  admissions: Admission[];
  wardIndents: WardIndent[];
  doctors: DoctorProfile[];
  hospitalAccount: HospitalAccount | null;
  departments: Department[];
};
