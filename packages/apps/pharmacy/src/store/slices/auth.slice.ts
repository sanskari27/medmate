import { createSlice } from "@reduxjs/toolkit";
import type { BusinessType } from "@/types";
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
import { asPlan, todayISO } from "@/utils";
import {
  patchInvoiceSettings,
  patchKiosk,
  setHoldSetup,
  setPinFlags,
} from "@/store/actions/auth.actions";
import type { SessionSnapshot } from "@/store/session";
import {
  addAdvisor,
  addEmployee,
  addUser,
  commitSetup,
  completeSetup,
  loadSession,
  saveBankAccount,
  saveInvoiceSettings,
  saveKiosk,
  signOutRequest,
  toggleAutoRenew,
  toggleStoreOpen,
  toggleUser,
  updateAdvisor,
  updateEmployee,
  updateProfile,
  updateUser,
  verifyBankAccount,
  verifyOtp,
} from "@/store/thunks/auth.thunk";

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
  holdSetup: boolean;
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
  kioskSaved: KioskConfig;
  advisors: Advisor[];
  caShares: CAShare[];
  employees: Employee[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  saving: boolean;
};

const initialState: AuthState = {
  signedIn: false,
  needsPin: false,
  pinReset: false,
  impersonator: null,
  businessType: "pharmacy",
  setupComplete: false,
  holdSetup: false,
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
  kioskSaved: { ...DEFAULT_KIOSK, enabled: false, displayName: "", pin: "", welcome: "" },
  advisors: [],
  caShares: [],
  employees: [],
  loading: false,
  loaded: false,
  error: null,
  saving: false,
};

function applySession(state: AuthState, session: SessionSnapshot) {
  state.signedIn = true;
  state.impersonator = session.impersonator || null;
  if (session.businessType) state.businessType = session.businessType;
  if (!state.holdSetup && session.setupComplete !== undefined)
    state.setupComplete = session.setupComplete;
  const previousSince = state.subscription.since;
  state.subscription = {
    ...DEFAULT_SUBSCRIPTION,
    ...(session.subscription ?? {}),
    plan: asPlan(session.subscription?.plan) ?? "Essential",
  };
  if (!state.subscription.since) state.subscription.since = previousSince;
  state.grants = session.grants || [];
  state.extraSeats = session.extraSeats || 0;
  state.subscriptionRequests = (session.subscriptionRequests || []).map((request) => ({
    ...request,
    plan: asPlan(request.plan) ?? request.plan,
  }));
  state.couponRedeemed = session.couponRedeemed === true;
  state.me = session.user
    ? { id: session.user.id, role: session.user.role, permissions: session.user.permissions ?? [] }
    : null;
  state.caShares = session.caShares || [];
  if (session.profile) state.profile = session.profile;
  if (session.invoiceSettings) state.invoiceSettings = session.invoiceSettings;
  if (session.kiosk) {
    state.kiosk = session.kiosk;
    state.kioskSaved = session.kiosk;
  }
  state.employees = session.employees || [];
  state.users = session.users || [];
  state.bankAccount = session.bankAccount ?? null;
  state.advisors = session.advisors || [];
  state.needsPin = Boolean(session.needsPin);
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(patchInvoiceSettings, (state, action) => {
        state.invoiceSettings = action.payload;
      })
      .addCase(patchKiosk, (state, action) => {
        state.kiosk = action.payload;
      })
      .addCase(setHoldSetup, (state, action) => {
        state.holdSetup = action.payload;
        if (action.payload) state.setupComplete = false;
      })
      .addCase(setPinFlags, (state, action) => {
        if (action.payload.pinReset !== undefined) state.pinReset = action.payload.pinReset;
        if (action.payload.needsPin !== undefined) state.needsPin = action.payload.needsPin;
      })
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
        state.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applySession(state, action.payload);
        state.loading = false;
        state.loaded = true;
        state.hydrated = true;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.hydrated = true;
        if (action.payload === "UNAUTHORIZED") {
          state.signedIn = false;
          state.impersonator = null;
          state.error = null;
          return;
        }
        state.error = action.payload ?? "Could not load the pharmacy";
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        if (action.meta.arg.purpose === "reset") state.pinReset = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      })
      .addCase(toggleStoreOpen.fulfilled, (state) => {
        state.profile.storeOpen = !state.profile.storeOpen;
      })
      .addCase(saveInvoiceSettings.fulfilled, (state, action) => {
        state.invoiceSettings = action.payload;
      })
      .addCase(saveKiosk.fulfilled, (state, action) => {
        state.kiosk = action.payload;
        state.kioskSaved = action.payload;
      })
      .addCase(saveKiosk.rejected, (state) => {
        state.kiosk = state.kioskSaved;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.users = state.users.map((user) =>
          user.id === action.payload.id ? { ...user, ...action.payload.patch } : user,
        );
      })
      .addCase(toggleUser.fulfilled, (state, action) => {
        state.users = state.users.map((user) =>
          user.id === action.payload ? { ...user, active: !user.active } : user,
        );
      })
      .addCase(toggleAutoRenew.pending, (state) => {
        state.subscription.autoRenew = !state.subscription.autoRenew;
      })
      .addCase(toggleAutoRenew.rejected, (state) => {
        state.subscription.autoRenew = !state.subscription.autoRenew;
      })
      .addCase(saveBankAccount.fulfilled, (state, action) => {
        state.bankAccount = { ...action.payload, verified: false, addedOn: todayISO() };
      })
      .addCase(verifyBankAccount.fulfilled, (state) => {
        if (state.bankAccount) state.bankAccount.verified = true;
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.employees = state.employees.map((employee) =>
          employee.id === action.payload.id ? { ...employee, ...action.payload.patch } : employee,
        );
      })
      .addCase(completeSetup.fulfilled, (state) => {
        state.holdSetup = false;
        state.setupComplete = true;
      })
      .addCase(commitSetup.fulfilled, (state) => {
        state.holdSetup = false;
        state.setupComplete = true;
      })
      .addCase(updateAdvisor.fulfilled, (state, action) => {
        state.advisors = state.advisors.map((advisor) =>
          advisor.id === action.payload.id ? { ...advisor, ...action.payload.patch } : advisor,
        );
      })
      .addCase(addUser.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addEmployee.pending, (state) => {
        state.saving = true;
      })
      .addCase(addAdvisor.pending, (state) => {
        state.saving = true;
      })
      .addCase(signOutRequest.fulfilled, () => ({ ...initialState, hydrated: true, loaded: true }))
      .addMatcher(
        (action) => action.type.startsWith("auth/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.saving = false;
          const payload = (action as { payload?: unknown }).payload;
          if (typeof payload === "string" && payload !== "UNAUTHORIZED") state.error = payload;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("auth/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.saving = false;
        },
      );
  },
});

export default authSlice.reducer;
