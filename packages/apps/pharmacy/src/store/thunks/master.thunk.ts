import { createAsyncThunk } from "@reduxjs/toolkit";
import { ApiError } from "@/services/api/apiClient";
import { masterService, subscriptionService } from "@/services/api/endpoints/master";
import type {
  CouponPreview,
  MasterAudit,
  MasterBooking,
  MasterCoupon,
  MasterPharmacy,
  MasterProfile,
  MasterReferral,
  MasterRequest,
  MasterTicket,
} from "@/services/api/endpoints/master";
import type { Plan } from "@/utils";
import { faultMessage } from "@/store/faultMessage";

export type MasterDeskPayload = {
  pharmacies: MasterPharmacy[];
  requests: MasterRequest[];
  tickets: MasterTicket[];
  referrals: MasterReferral[];
  bookings: MasterBooking[];
};

export const loadMasterSession = createAsyncThunk<string | null, void, { rejectValue: string }>(
  "master/loadSession",
  async (_, { rejectWithValue }) => {
    try {
      const row = await masterService.session();
      return row.phone;
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 401) return rejectWithValue("UNAUTHORIZED");
      return rejectWithValue(faultMessage(error, "No master session"));
    }
  },
);

export const loadMasterDesk = createAsyncThunk<MasterDeskPayload, void, { rejectValue: string }>(
  "master/loadDesk",
  async (_, { rejectWithValue }) => {
    try {
      const [pharmacies, requests, work, bookings] = await Promise.all([
        masterService.pharmacies(),
        masterService.requests(),
        masterService.work(),
        masterService.consultations(),
      ]);
      return {
        pharmacies,
        requests,
        tickets: work.tickets,
        referrals: work.referrals,
        bookings,
      };
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not load the master desk"));
    }
  },
);

export const loadMasterAudit = createAsyncThunk<MasterAudit[], void, { rejectValue: string }>(
  "master/loadAudit",
  async (_, { rejectWithValue }) => {
    try {
      return await masterService.audit();
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not load activity"));
    }
  },
);

export const openMasterPharmacy = createAsyncThunk<MasterProfile, string, { rejectValue: string }>(
  "master/openPharmacy",
  async (id, { rejectWithValue }) => {
    try {
      return await masterService.pharmacy(id);
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not open the pharmacy"));
    }
  },
);

export const saveMasterChange = createAsyncThunk<
  void,
  {
    path: string;
    method: string;
    body: unknown;
    reason: string;
    pharmacyId?: string;
    refreshAudit?: boolean;
  },
  { rejectValue: string }
>("master/save", async (body, { dispatch, rejectWithValue }) => {
  try {
    const payload =
      body.body && typeof body.body === "object"
        ? { ...(body.body as object), reason: body.reason }
        : { reason: body.reason };
    await masterService.save(body.path, body.method, payload);
    await dispatch(loadMasterDesk()).unwrap();
    if (body.pharmacyId) await dispatch(openMasterPharmacy(body.pharmacyId)).unwrap();
    if (body.refreshAudit) await dispatch(loadMasterAudit()).unwrap();
  } catch (error: unknown) {
    return rejectWithValue(faultMessage(error, "Save failed"));
  }
});

export const masterSignOut = createAsyncThunk<void, void, { rejectValue: string }>(
  "master/signOut",
  async () => {
    try {
      await masterService.signOut();
    } catch {
      // The portal still closes when the request fails.
    }
  },
);

export const markConsultationHandled = createAsyncThunk<number, number, { rejectValue: string }>(
  "master/markConsultation",
  async (id, { dispatch, rejectWithValue }) => {
    try {
      await masterService.markConsultation(id);
      await dispatch(loadMasterDesk()).unwrap();
      return id;
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Save failed"));
    }
  },
);

export const impersonatePharmacy = createAsyncThunk<void, string, { rejectValue: string }>(
  "master/impersonate",
  async (id, { rejectWithValue }) => {
    try {
      await masterService.impersonate(id);
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not open the pharmacy"));
    }
  },
);

export const loadCoupons = createAsyncThunk<MasterCoupon[], void, { rejectValue: string }>(
  "master/loadCoupons",
  async (_, { rejectWithValue }) => {
    try {
      return await masterService.coupons();
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not load coupons"));
    }
  },
);

export const issueCoupon = createAsyncThunk<
  { code: string; plan: Plan; expiresOn: string; validDays: number },
  { code: string; plan: Plan; expiresOn: string; validDays: number },
  { rejectValue: string }
>("master/issueCoupon", async (body, { dispatch, rejectWithValue }) => {
  try {
    await masterService.issueCoupon(body);
    await dispatch(loadCoupons()).unwrap();
    return body;
  } catch (error: unknown) {
    return rejectWithValue(faultMessage(error, "Could not issue the coupon"));
  }
});

export const previewCoupon = createAsyncThunk<CouponPreview, string, { rejectValue: string }>(
  "auth/previewCoupon",
  async (code, { rejectWithValue }) => {
    try {
      return await subscriptionService.previewCoupon(code);
    } catch (error: unknown) {
      return rejectWithValue(faultMessage(error, "Could not check that code"));
    }
  },
);
