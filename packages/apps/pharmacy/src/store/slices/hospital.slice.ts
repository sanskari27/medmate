import { createSlice } from "@reduxjs/toolkit";
import type {
  Admission,
  Department,
  DoctorProfile,
  HospitalAccount,
  HospitalPayment,
  PriceRule,
  TpaClaim,
  Ward,
  WardIndent,
  WardSupply,
} from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import {
  dischargePatient,
  setClaimStatus,
  setHospitalPriceRule,
  setIndentStatus,
  setUniformDiscount,
  updateAdmission,
  updateDoctor,
  updateHospitalAccount,
  updateWard,
} from "@/store/thunks/hospital.thunk";

export const BLANK_HOSPITAL: HospitalAccount = {
  name: "",
  gstin: "",
  contact: "",
  phone: "",
  email: "",
  creditTerms: "On demand",
  creditLimit: 0,
  discountPct: 0,
  flagRefills: false,
};

export type HospitalState = {
  wards: Ward[];
  admissions: Admission[];
  wardIndents: WardIndent[];
  departments: Department[];
  tpaClaims: TpaClaim[];
  doctors: DoctorProfile[];
  hospitalAccount: HospitalAccount;
  hospitalPriceRules: Record<string, PriceRule>;
  wardSupplies: WardSupply[];
  hospitalPayments: HospitalPayment[];
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: HospitalState = {
  wards: [],
  admissions: [],
  wardIndents: [],
  departments: [],
  tpaClaims: [],
  doctors: [],
  hospitalAccount: BLANK_HOSPITAL,
  hospitalPriceRules: {},
  wardSupplies: [],
  hospitalPayments: [],
  loading: false,
  loaded: false,
  saving: false,
  error: null,
};

function applyHospital(state: HospitalState, session: SessionSnapshot) {
  state.wardSupplies = session.wardSupplies || [];
  state.hospitalPayments = session.hospitalPayments || [];
  state.tpaClaims = session.tpaClaims || [];
  state.hospitalPriceRules = session.hospitalPriceRules || {};
  if (session.businessType === "hospital") {
    state.wards = session.wards || [];
    state.admissions = session.admissions || [];
    state.wardIndents = session.wardIndents || [];
    state.doctors = session.doctors || [];
    state.hospitalAccount = session.hospitalAccount ?? BLANK_HOSPITAL;
    state.departments = session.departments || [];
  }
}

const hospitalSlice = createSlice({
  name: "hospital",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applyHospital(state, action.payload);
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      .addCase(setIndentStatus.fulfilled, (state, action) => {
        state.wardIndents = state.wardIndents.map((indent) =>
          indent.id === action.payload.id
            ? {
                ...indent,
                status: action.payload.status,
                items:
                  action.payload.status === "issued"
                    ? indent.items.map((item) => ({ ...item, issued: item.qty }))
                    : indent.items,
              }
            : indent,
        );
      })
      .addCase(setClaimStatus.fulfilled, (state, action) => {
        state.tpaClaims = state.tpaClaims.map((claim) =>
          claim.id === action.payload.id
            ? {
                ...claim,
                status: action.payload.status,
                approvedAmount: action.payload.approvedAmount ?? claim.approvedAmount,
              }
            : claim,
        );
      })
      .addCase(updateWard.fulfilled, (state, action) => {
        state.wards = state.wards.map((ward) =>
          ward.id === action.payload.id ? { ...ward, ...action.payload.patch } : ward,
        );
      })
      .addCase(updateAdmission.fulfilled, (state, action) => {
        state.admissions = state.admissions.map((admission) =>
          admission.id === action.payload.id
            ? { ...admission, ...action.payload.patch }
            : admission,
        );
      })
      .addCase(dischargePatient.fulfilled, (state, action) => {
        state.admissions = state.admissions.map((admission) =>
          admission.id === action.payload
            ? { ...admission, status: "discharged", dischargedAt: Date.now() }
            : admission,
        );
      })
      .addCase(updateHospitalAccount.fulfilled, (state, action) => {
        state.hospitalAccount = { ...state.hospitalAccount, ...action.payload };
      })
      .addCase(setUniformDiscount.fulfilled, (state, action) => {
        state.hospitalAccount.discountPct = action.payload;
      })
      .addCase(setHospitalPriceRule.fulfilled, (state, action) => {
        state.hospitalPriceRules[action.payload.productId] = action.payload.rule;
      })
      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.doctors = state.doctors.map((doctor) =>
          doctor.id === action.payload.id ? { ...doctor, ...action.payload.patch } : doctor,
        );
      })
      .addCase(signOutRequest.fulfilled, () => initialState)
      .addMatcher(
        (action) => action.type.startsWith("hospital/") && action.type.endsWith("/pending"),
        (state) => {
          state.saving = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("hospital/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.saving = false;
          const payload = (action as { payload?: unknown }).payload;
          state.error = typeof payload === "string" ? payload : null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("hospital/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.saving = false;
        },
      );
  },
});

export default hospitalSlice.reducer;
