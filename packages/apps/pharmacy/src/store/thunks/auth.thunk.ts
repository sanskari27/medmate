import { createAsyncThunk } from "@/store/createAsyncThunk";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { ApiError } from "@/services/api/apiClient";
import { authService, type CouponPreview } from "@/services/api/endpoints/auth";
import { inventoryService } from "@/services/api/endpoints/inventory";
import type { BusinessType } from "@/types";
import type {
  Advisor,
  BankAccount,
  BillingCycle,
  Employee,
  InvoiceSettings,
  KioskConfig,
  PharmacyProfile,
  Plan,
  StaffUser,
} from "@/utils";
import { asPlan } from "@/utils";
import { patchInvoiceSettings, patchKiosk } from "@/store/actions/auth.actions";
import { setQuietRefresh, showToast } from "@/store/actions/feedback.actions";
import { faultMessage } from "@/store/faultMessage";
import type { SessionSnapshot } from "@/store/session";
import { write } from "@/store/write";

type Dispatch = ThunkDispatch<AuthGate, unknown, Action>;
type AuthGate = {
  auth: {
    signedIn: boolean;
    invoiceSettings: InvoiceSettings;
    kiosk: KioskConfig;
    profile: PharmacyProfile;
    users: StaffUser[];
    advisors: Advisor[];
  };
};

let boot: Promise<SessionSnapshot> | null = null;
let invoiceTimer: ReturnType<typeof setTimeout> | null = null;
let kioskTimer: ReturnType<typeof setTimeout> | null = null;

export const loadSession = createAsyncThunk<SessionSnapshot, void, { rejectValue: string }>(
  "auth/loadSession",
  async (_, { rejectWithValue }) => {
    try {
      if (!boot) {
        boot = authService.loadSession().finally(() => {
          boot = null;
        });
      }
      return await boot;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return rejectWithValue("UNAUTHORIZED");
      return rejectWithValue(faultMessage(error, "Could not load the pharmacy"));
    }
  },
);

function reload(dispatch: Dispatch) {
  return () => dispatch(loadSession()).unwrap();
}

export const signOutRequest = createAsyncThunk<void, void, { rejectValue: string }>(
  "auth/signOut",
  async () => {
    try {
      await authService.signOut();
    } catch {
      // Local sign-out still proceeds when the request fails.
    }
  },
);

export const sendOtp = createAsyncThunk<
  { delivery?: string },
  { phone: string; purpose?: "reset" },
  { rejectValue: string }
>("auth/sendOtp", async (body, { rejectWithValue }) => {
  try {
    return await authService.sendOtp(body);
  } catch (error: unknown) {
    return rejectWithValue(faultMessage(error, "Could not send OTP"));
  }
});

export const beginLogin = createAsyncThunk<
  { mode: "pin" | "otp" },
  string,
  { rejectValue: string }
>("auth/beginLogin", async (phone, { rejectWithValue }) => {
  try {
    return await authService.beginLogin(phone);
  } catch (error: unknown) {
    return rejectWithValue(faultMessage(error, "Could not continue"));
  }
});

export const verifyOtp = createAsyncThunk<
  void,
  {
    phone: string;
    code: string;
    businessType?: BusinessType;
    name?: string;
    purpose?: "reset";
  },
  { state: AuthGate; rejectValue: string }
>("auth/verifyOtp", async (body, { dispatch, rejectWithValue }) => {
  try {
    await authService.verifyOtp(body);
    await dispatch(loadSession()).unwrap();
  } catch (error: unknown) {
    return rejectWithValue(faultMessage(error, "Could not sign in"));
  }
});

export const pinSignIn = createAsyncThunk<
  void,
  { phone: string; pin: string },
  { rejectValue: string }
>("auth/pinSignIn", async (body, { dispatch, rejectWithValue }) => {
  try {
    await authService.pinSignIn(body);
    await dispatch(loadSession()).unwrap();
  } catch (error: unknown) {
    return rejectWithValue(faultMessage(error, "Could not sign in"));
  }
});

export const saveLoginPin = createAsyncThunk<
  void,
  { pin: string; confirm: string },
  { state: AuthGate; rejectValue: string }
>("auth/saveLoginPin", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the PIN",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.saveLoginPin(body);
    },
  }),
);

export const updateProfile = createAsyncThunk<
  PharmacyProfile,
  Partial<PharmacyProfile>,
  { state: AuthGate; rejectValue: string }
>("auth/updateProfile", async (patch, { dispatch, getState, rejectWithValue }) => {
  const next = { ...getState().auth.profile, ...patch };
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the pharmacy",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.updateProfile(next);
      return next;
    },
  });
});

export const toggleStoreOpen = createAsyncThunk<
  void,
  void,
  { state: AuthGate; rejectValue: string }
>("auth/toggleStoreOpen", async (_, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the store",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.toggleStoreOpen();
    },
  }),
);

export const saveInvoiceSettings = createAsyncThunk<
  InvoiceSettings,
  InvoiceSettings,
  { state: AuthGate; rejectValue: string }
>("auth/saveInvoiceSettings", async (invoice, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save invoice settings",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.saveInvoiceSettings(invoice);
      return invoice;
    },
  }),
);

export function queueInvoiceSettings(patch: Partial<InvoiceSettings>) {
  return (dispatch: Dispatch, getState: () => AuthGate) => {
    const next = { ...getState().auth.invoiceSettings, ...patch };
    dispatch(patchInvoiceSettings(next));
    dispatch(setQuietRefresh(true));
    if (invoiceTimer) clearTimeout(invoiceTimer);
    invoiceTimer = setTimeout(() => {
      invoiceTimer = null;
      dispatch(setQuietRefresh(false));
      void dispatch(saveInvoiceSettings(next));
    }, 400);
  };
}

export const saveKiosk = createAsyncThunk<
  KioskConfig,
  KioskConfig,
  { state: AuthGate; rejectValue: string }
>("auth/saveKiosk", async (kiosk, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the kiosk",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.saveKiosk(kiosk);
      return kiosk;
    },
  }),
);

export function queueKiosk(patch: Partial<KioskConfig>) {
  return (dispatch: Dispatch, getState: () => AuthGate) => {
    const next = { ...getState().auth.kiosk, ...patch };
    dispatch(patchKiosk(next));
    dispatch(setQuietRefresh(true));
    if (kioskTimer) clearTimeout(kioskTimer);
    kioskTimer = setTimeout(() => {
      kioskTimer = null;
      dispatch(setQuietRefresh(false));
      void dispatch(saveKiosk(next));
    }, 400);
    return next;
  };
}

export const addUser = createAsyncThunk<
  Omit<StaffUser, "id" | "lastActiveMins">,
  Omit<StaffUser, "id" | "lastActiveMins">,
  { state: AuthGate; rejectValue: string }
>("auth/addUser", async (user, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the user",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.addUser(user);
      dispatch(showToast(user.name + " added"));
      return user;
    },
  }),
);

export const updateUser = createAsyncThunk<
  { id: string; patch: Partial<StaffUser> },
  { id: string; patch: Partial<StaffUser> },
  { state: AuthGate; rejectValue: string }
>("auth/updateUser", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the user",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.updateUser(body.id, body.patch);
      return body;
    },
  }),
);

export const toggleUser = createAsyncThunk<
  string,
  string,
  { state: AuthGate; rejectValue: string }
>("auth/toggleUser", async (id, { dispatch, getState, rejectWithValue }) => {
  const user = getState().auth.users.find((row) => row.id === id);
  if (!user) return rejectWithValue("User not found");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the user",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.updateUser(id, { active: !user.active });
      return id;
    },
  });
});

export const requestPlan = createAsyncThunk<
  { plan: Plan; cycle: BillingCycle; kind: "plan" | "renewal" },
  { plan: Plan; cycle: BillingCycle; kind?: "plan" | "renewal" },
  { state: AuthGate; rejectValue: string }
>("auth/requestPlan", async (body, { dispatch, getState, rejectWithValue }) => {
  const kind = body.kind ?? "plan";
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not send the request",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.requestPlan({ ...body, kind });
      dispatch(
        showToast(
          kind === "renewal" ? "Renewal request sent" : `Request for the ${body.plan} plan sent`,
        ),
      );
      return { ...body, kind };
    },
  });
});

export const redeemCoupon = createAsyncThunk<
  string,
  string,
  { state: AuthGate; rejectValue: string }
>("auth/redeemCoupon", async (code, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not apply the coupon",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.redeemCoupon(code);
      dispatch(showToast("Coupon applied"));
      return code;
    },
  }),
);

export const toggleAutoRenew = createAsyncThunk<
  void,
  void,
  { state: AuthGate; rejectValue: string }
>("auth/toggleAutoRenew", async (_, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update auto-renew",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.toggleAutoRenew();
    },
  }),
);

export const saveBankAccount = createAsyncThunk<
  Omit<BankAccount, "verified" | "addedOn">,
  Omit<BankAccount, "verified" | "addedOn">,
  { state: AuthGate; rejectValue: string }
>("auth/saveBankAccount", async (account, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the bank account",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.saveBankAccount(account);
      dispatch(showToast("Bank account saved — verification pending"));
      return account;
    },
  }),
);

export const verifyBankAccount = createAsyncThunk<
  void,
  void,
  { state: AuthGate; rejectValue: string }
>("auth/verifyBankAccount", async (_, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not verify the bank account",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.verifyBankAccount();
      dispatch(showToast("Bank account verified"));
    },
  }),
);

export const completeSetup = createAsyncThunk<void, void, { state: AuthGate; rejectValue: string }>(
  "auth/completeSetup",
  async (_, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not finish setup",
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await authService.completeSetup();
        dispatch(showToast("Store setup complete"));
      },
    }),
);

export const commitSetup = createAsyncThunk<
  void,
  {
    profile: Partial<PharmacyProfile>;
    invoice: Partial<InvoiceSettings>;
    kioskEnabled: boolean;
    loose: boolean;
    featureLocked: boolean;
  },
  { state: AuthGate; rejectValue: string }
>("auth/commitSetup", async (input, { dispatch, getState, rejectWithValue }) => {
  const state = getState().auth;
  const phone = state.profile.phone;
  const next = {
    ...state.profile,
    ...input.profile,
    gstRegistered: true,
    phone: phone.replace(/\D/g, "").length >= 10 ? phone : input.profile.phone || phone,
  };
  const invoice = { ...state.invoiceSettings, ...input.invoice };
  const kioskNext = { ...state.kiosk, enabled: input.kioskEnabled };
  return write({
    signedIn: state.signedIn,
    fallback: "Could not finish setup",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      dispatch(setQuietRefresh(true));
      try {
        await authService.updateProfile(next);
        await authService.saveInvoiceSettings(invoice);
        if (!input.featureLocked) await authService.saveKiosk(kioskNext);
        await inventoryService.setLooseDefault(input.loose);
        await authService.completeSetup();
        dispatch(showToast("Store setup complete"));
      } finally {
        dispatch(setQuietRefresh(false));
      }
    },
  });
});

export const addEmployee = createAsyncThunk<
  Omit<Employee, "id">,
  Omit<Employee, "id">,
  { state: AuthGate; rejectValue: string }
>("auth/addEmployee", async (employee, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the employee",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.addEmployee(employee);
      dispatch(showToast(employee.name + " added"));
      return employee;
    },
  }),
);

export const updateEmployee = createAsyncThunk<
  { id: string; patch: Partial<Employee> },
  { id: string; patch: Partial<Employee> },
  { state: AuthGate; rejectValue: string }
>("auth/updateEmployee", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the employee",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.updateEmployee(body.id, body.patch);
      return body;
    },
  }),
);

export const addAdvisor = createAsyncThunk<
  Omit<Advisor, "id">,
  Omit<Advisor, "id">,
  { state: AuthGate; rejectValue: string }
>("auth/addAdvisor", async (advisor, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the advisor",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.addAdvisor(advisor);
      dispatch(showToast(advisor.type + " " + advisor.name + " added"));
      return advisor;
    },
  }),
);

export const updateAdvisor = createAsyncThunk<
  { id: string; patch: Partial<Advisor> },
  { id: string; patch: Partial<Advisor> },
  { state: AuthGate; rejectValue: string }
>("auth/updateAdvisor", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the advisor",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.updateAdvisor(body.id, body.patch);
      return body;
    },
  }),
);

export const shareWithCA = createAsyncThunk<
  { period: string; reports: string[]; advisorId: string },
  { period: string; reports: string[]; advisorId: string },
  { state: AuthGate; rejectValue: string }
>("auth/shareWithCA", async (body, { dispatch, getState, rejectWithValue }) => {
  const advisors = getState().auth.advisors;
  const advisor = advisors.find((row) => row.id === body.advisorId) ?? advisors[0];
  if (!advisor) return rejectWithValue("Add an advisor first");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not share the reports",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.shareWithCA(body);
      dispatch(showToast("Reports shared with " + advisor.name));
      return body;
    },
  });
});

export const raiseTicket = createAsyncThunk<
  { subject: string; category: string },
  { subject: string; category: string },
  { state: AuthGate; rejectValue: string }
>("auth/raiseTicket", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not raise the ticket",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await authService.raiseTicket(body.subject, body.category);
      dispatch(showToast("Ticket raised"));
      return body;
    },
  }),
);

export function planOf(value: unknown) {
  return asPlan(value);
}

export const previewCoupon = createAsyncThunk<CouponPreview, string, { rejectValue: string }>(
  "auth/previewCoupon",
  async (code, { rejectWithValue }) => {
    try {
      return await authService.previewCoupon(code);
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not check that code"));
    }
  },
);
