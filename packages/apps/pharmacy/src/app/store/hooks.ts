import { useCallback } from "react";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import { setAuthField, type AuthState } from "@/store/slices/auth";
import { setBillingField, type BillingState } from "@/store/slices/billing";
import { setCrmField, type CrmState } from "@/store/slices/crm";
import { setCustomersField, type CustomersState } from "@/store/slices/customers";
import { setHospitalField, type HospitalState } from "@/store/slices/hospital";
import { setInventoryField, type InventoryState } from "@/store/slices/inventory";
import { setOrdersField } from "@/store/slices/orders";
import { setPrescriptionsField, type PrescriptionsState } from "@/store/slices/prescriptions";
import { setPurchasesField, type PurchasesState } from "@/store/slices/purchases";
import { setReportsField, type ReportsState } from "@/store/slices/reports";
import { setSalesField, type SalesState } from "@/store/slices/sales";
import { setUiField, type UiState } from "@/store/slices/ui";
import type { AppDispatch } from "./store";
import { store } from "./store";
import type { RootState } from "./rootReducer";

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const fieldSlice = {
  signedIn: "auth",
  needsPin: "auth",
  pinReset: "auth",
  impersonator: "auth",
  businessType: "auth",
  setupComplete: "auth",
  me: "auth",
  hydrated: "auth",
  users: "auth",
  subscription: "auth",
  grants: "auth",
  extraSeats: "auth",
  subscriptionRequests: "auth",
  couponRedeemed: "auth",
  profile: "auth",
  bankAccount: "auth",
  invoiceSettings: "auth",
  kiosk: "auth",
  advisors: "auth",
  caShares: "auth",
  employees: "auth",
  leaveOpen: "ui",
  route: "ui",
  canGoBack: "ui",
  invFilter: "ui",
  toastMsg: "ui",
  formFault: "ui",
  billIndentTarget: "ui",
  pricingUnlocked: "ui",
  tickets: "ui",
  inventory: "inventory",
  racks: "inventory",
  sales: "sales",
  offers: "sales",
  lastInvoice: "sales",
  pos: "billing",
  posCustomer: "billing",
  posDiscount: "billing",
  posDiscountMode: "billing",
  posPay: "billing",
  posSource: "billing",
  posWard: "billing",
  posInsurer: "billing",
  posPatientId: "billing",
  posRxImage: "billing",
  creditPayments: "customers",
  referrals: "customers",
  crm: "crm",
  purchases: "purchases",
  purchaseOrders: "purchases",
  suppliers: "purchases",
  supplyList: "purchases",
  expenses: "purchases",
  expenseCategories: "purchases",
  prescriptions: "prescriptions",
  wards: "hospital",
  admissions: "hospital",
  wardIndents: "hospital",
  departments: "hospital",
  tpaClaims: "hospital",
  doctors: "hospital",
  hospitalAccount: "hospital",
  hospitalPriceRules: "hospital",
  wardSupplies: "hospital",
  hospitalPayments: "hospital",
  reportTarget: "reports",
} as const;

type SessionKey = keyof typeof fieldSlice;
type SessionValues = AuthState &
  BillingState &
  CrmState &
  CustomersState &
  HospitalState &
  InventoryState &
  PrescriptionsState &
  PurchasesState &
  ReportsState &
  SalesState &
  UiState;

const setters = {
  auth: setAuthField,
  billing: setBillingField,
  crm: setCrmField,
  customers: setCustomersField,
  hospital: setHospitalField,
  inventory: setInventoryField,
  orders: setOrdersField,
  prescriptions: setPrescriptionsField,
  purchases: setPurchasesField,
  reports: setReportsField,
  sales: setSalesField,
  ui: setUiField,
};

export function resolveSetState<T>(current: T, next: T | ((value: T) => T)): T {
  if (typeof next === "function") return (next as (value: T) => T)(current);
  return next;
}

export function useSessionField<K extends SessionKey>(
  key: K,
): [
  SessionValues[K],
  (next: SessionValues[K] | ((value: SessionValues[K]) => SessionValues[K])) => void,
] {
  const slice = fieldSlice[key];
  const value = useAppSelector(
    (state) => (state[slice] as Record<string, unknown>)[key],
  ) as SessionValues[K];
  const dispatch = useAppDispatch();
  const set = useCallback(
    (next: SessionValues[K] | ((value: SessionValues[K]) => SessionValues[K])) => {
      const current = (store.getState()[slice] as Record<string, unknown>)[key] as SessionValues[K];
      const payload = { key, value: resolveSetState(current, next) };
      dispatch((setters[slice] as (action: typeof payload) => ReturnType<AppDispatch>)(payload));
    },
    [dispatch, key, slice],
  );
  return [value, set];
}
