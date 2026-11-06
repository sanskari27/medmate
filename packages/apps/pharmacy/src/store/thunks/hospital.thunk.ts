import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { hospitalService } from "@/services/api/endpoints/hospital";
import type {
  Admission,
  ClaimStatus,
  Department,
  DoctorProfile,
  HospitalAccount,
  HospitalPayment,
  IndentStatus,
  InvProduct,
  PriceRule,
  Ward,
  WardIndent,
  WardSupply,
  WardSupplyItem,
} from "@/utils";
import { creditPriceOf, earliestBatch, isValidGstin } from "@/utils";
import { setFormFault, setPricingUnlocked, showToast } from "@/store/actions/feedback.actions";
import { faultOf } from "@/utils/validation";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = {
  auth: { signedIn: boolean };
  ui: { pricingUnlocked: boolean };
  inventory: { inventory: InvProduct[] };
  hospital: {
    wardIndents: WardIndent[];
    hospitalAccount: HospitalAccount;
    hospitalPriceRules: Record<string, PriceRule>;
  };
};
type Dispatch = ThunkDispatch<Gate, unknown, Action>;
const reload = (dispatch: Dispatch) => () => dispatch(loadSession()).unwrap();

const supplyTotal = (items: WardSupplyItem[]) =>
  Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
const rupee = (amount: number) => "₹" + Math.round(amount).toLocaleString("en-IN");

export const setIndentStatus = createAsyncThunk<
  { id: string; status: IndentStatus },
  { id: string; status: IndentStatus },
  { state: Gate; rejectValue: string }
>("hospital/setIndentStatus", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the indent",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.setIndentStatus(body.id, body.status);
      const label =
        body.status === "issued"
          ? "Indent issued · stock dispatched to ward"
          : body.status === "approved"
            ? "Indent approved"
            : body.status === "rejected"
              ? "Indent rejected"
              : "Indent updated";
      dispatch(showToast(label));
      return body;
    },
  }),
);

export const setClaimStatus = createAsyncThunk<
  { id: string; status: ClaimStatus; approvedAmount?: number },
  { id: string; status: ClaimStatus; approvedAmount?: number },
  { state: Gate; rejectValue: string }
>("hospital/setClaimStatus", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the claim",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.setClaimStatus(body.id, body.status, body.approvedAmount);
      dispatch(showToast("Claim " + body.id + " · " + body.status));
      return body;
    },
  }),
);

export const addWard = createAsyncThunk<
  Omit<Ward, "id">,
  Omit<Ward, "id">,
  { state: Gate; rejectValue: string }
>("hospital/addWard", async (ward, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the ward",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.addWard(ward);
      dispatch(showToast(ward.name + " added"));
      return ward;
    },
  }),
);

export const updateWard = createAsyncThunk<
  { id: string; patch: Partial<Ward> },
  { id: string; patch: Partial<Ward> },
  { state: Gate; rejectValue: string }
>("hospital/updateWard", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the ward",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.updateWard(body.id, body.patch);
      return body;
    },
  }),
);

export const admitPatient = createAsyncThunk<
  Admission,
  Omit<Admission, "id" | "admittedAt" | "status">,
  { state: Gate; rejectValue: string }
>("hospital/admitPatient", async (admission, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not admit the patient",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      const saved = await hospitalService.admitPatient(admission);
      dispatch(showToast(`${admission.name} admitted · ${admission.bed}`));
      return saved;
    },
  }),
);

export const updateAdmission = createAsyncThunk<
  { id: string; patch: Partial<Admission> },
  { id: string; patch: Partial<Admission> },
  { state: Gate; rejectValue: string }
>("hospital/updateAdmission", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the admission",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.updateAdmission(body.id, body.patch);
      return body;
    },
  }),
);

export const dischargePatient = createAsyncThunk<
  string,
  string,
  { state: Gate; rejectValue: string }
>("hospital/dischargePatient", async (id, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not discharge the patient",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.dischargePatient(id);
      dispatch(showToast("Patient discharged · bed freed"));
      return id;
    },
  }),
);

export const updateHospitalAccount = createAsyncThunk<
  Partial<HospitalAccount>,
  Partial<HospitalAccount>,
  { state: Gate; rejectValue: string }
>("hospital/updateHospitalAccount", async (patch, { dispatch, getState, rejectWithValue }) => {
  if (typeof patch.gstin === "string" && patch.gstin.trim() && !isValidGstin(patch.gstin)) {
    if (patch.gstin.trim().length >= 15) {
      dispatch(setFormFault(faultOf(new Error("Enter a valid GSTIN"))));
      return rejectWithValue("Enter a valid GSTIN");
    }
    return patch;
  }
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the hospital account",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.updateHospitalAccount(patch);
      return patch;
    },
  });
});

export const unlockPricing = createAsyncThunk<void, string, { state: Gate; rejectValue: string }>(
  "hospital/unlockPricing",
  async (otp, { dispatch, rejectWithValue }) => {
    try {
      await hospitalService.unlockPricing(otp);
      dispatch(setPricingUnlocked(true));
      dispatch(showToast("Pricing unlocked by admin"));
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : "Incorrect admin OTP");
    }
  },
);

export const setUniformDiscount = createAsyncThunk<
  number,
  number,
  { state: Gate; rejectValue: string }
>("hospital/setUniformDiscount", async (percent, { dispatch, getState, rejectWithValue }) => {
  if (!getState().ui.pricingUnlocked) {
    dispatch(showToast("Unlock pricing with admin OTP first"));
    return rejectWithValue("Unlock pricing with admin OTP first");
  }
  const discountPct = Math.max(0, Math.min(95, Math.round(percent)));
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the discount",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.setUniformDiscount(discountPct);
      return discountPct;
    },
  });
});

export const setHospitalPriceRule = createAsyncThunk<
  { productId: string; rule: PriceRule },
  { productId: string; rule: PriceRule | null },
  { state: Gate; rejectValue: string }
>("hospital/setHospitalPriceRule", async (body, { dispatch, getState, rejectWithValue }) => {
  if (!getState().ui.pricingUnlocked) {
    dispatch(showToast("Unlock pricing with admin OTP first"));
    return rejectWithValue("Unlock pricing with admin OTP first");
  }
  if (!body.rule || Number.isNaN(body.rule.value) || body.rule.value < 0) {
    dispatch(showToast("Records cannot be deleted"));
    return rejectWithValue("Records cannot be deleted");
  }
  const rule = { mode: body.rule.mode, value: Math.round(body.rule.value * 100) / 100 };
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the price rule",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.setHospitalPriceRule(body.productId, rule);
      return { productId: body.productId, rule };
    },
  });
});

async function postSupply(
  kind: "issue" | "return",
  draft: Omit<WardSupply, "id" | "kind" | "at" | "total">,
  dispatch: Dispatch,
  getState: () => Gate,
  rejectWithValue: (message: string) => unknown,
): Promise<WardSupply> {
  if (!draft.items.length) {
    return rejectWithValue(
      kind === "issue" ? "Nothing to issue" : "Nothing to return",
    ) as WardSupply;
  }
  return write({
    signedIn: getState().auth.signedIn,
    fallback: kind === "issue" ? "Could not issue the supply" : "Could not return the supply",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      if (kind === "issue") await hospitalService.issueWardSupply(draft);
      else await hospitalService.returnWardSupply(draft);
      const supply: WardSupply = {
        ...draft,
        id: kind === "issue" ? "WS" : "WR",
        kind,
        total: supplyTotal(draft.items),
        at: Date.now(),
      };
      dispatch(
        showToast(
          kind === "issue"
            ? `Issued to ${draft.wardName} · ${rupee(supply.total)} to hospital a/c`
            : `Return from ${draft.wardName} · credit note ${rupee(supply.total)}`,
        ),
      );
      return supply;
    },
  });
}

export const issueWardSupply = createAsyncThunk<
  WardSupply,
  Omit<WardSupply, "id" | "kind" | "at" | "total">,
  { state: Gate; rejectValue: string }
>("hospital/issueWardSupply", (draft, api) =>
  postSupply("issue", draft, api.dispatch, api.getState, api.rejectWithValue),
);

export const returnWardSupply = createAsyncThunk<
  WardSupply,
  Omit<WardSupply, "id" | "kind" | "at" | "total">,
  { state: Gate; rejectValue: string }
>("hospital/returnWardSupply", (draft, api) =>
  postSupply("return", draft, api.dispatch, api.getState, api.rejectWithValue),
);

export const recordHospitalPayment = createAsyncThunk<
  Omit<HospitalPayment, "id" | "at">,
  Omit<HospitalPayment, "id" | "at">,
  { state: Gate; rejectValue: string }
>("hospital/recordHospitalPayment", async (payment, { dispatch, getState, rejectWithValue }) => {
  if (payment.amount <= 0) return rejectWithValue("Amount must be positive");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not record the payment",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.recordHospitalPayment(payment);
      dispatch(showToast(`Hospital payment ${rupee(payment.amount)} recorded`));
      return payment;
    },
  });
});

export const addDoctor = createAsyncThunk<
  Omit<DoctorProfile, "id">,
  Omit<DoctorProfile, "id">,
  { state: Gate; rejectValue: string }
>("hospital/addDoctor", async (doctor, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the doctor",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.addDoctor(doctor);
      dispatch(showToast(doctor.name + " added"));
      return doctor;
    },
  }),
);

export const updateDoctor = createAsyncThunk<
  { id: string; patch: Partial<DoctorProfile> },
  { id: string; patch: Partial<DoctorProfile> },
  { state: Gate; rejectValue: string }
>("hospital/updateDoctor", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the doctor",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.updateDoctor(body.id, body.patch);
      return body;
    },
  }),
);

export const addDepartment = createAsyncThunk<
  { name: string; head: string; type: Department["type"]; emoji?: string },
  { name: string; head: string; type: Department["type"]; emoji?: string },
  { state: Gate; rejectValue: string }
>("hospital/addDepartment", async (department, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the department",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.addDepartment(department);
      dispatch(showToast(department.name + " added"));
      return department;
    },
  }),
);

export const updateDepartment = createAsyncThunk<
  { id: string; patch: Partial<Department> },
  { id: string; patch: Partial<Department> },
  { state: Gate; rejectValue: string }
>("hospital/updateDepartment", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the department",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await hospitalService.updateDepartment(body.id, body.patch);
      return body;
    },
  }),
);

export const issueIndent = createAsyncThunk<boolean, string, { state: Gate; rejectValue: string }>(
  "hospital/issueIndent",
  async (indentId, api) => {
    const state = api.getState();
    const indent = state.hospital.wardIndents.find((row) => row.id === indentId);
    if (!indent || indent.items.length === 0) return false;
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
    const matched = indent.items.map((item) => {
      const product = state.inventory.inventory.find((candidate) => {
        const left = normalize(candidate.name);
        const right = normalize(item.name);
        return left === right || right.includes(left) || left.includes(right);
      });
      return product ? { product, qty: item.qty } : null;
    });
    if (matched.some((row) => !row)) return false;
    const items: WardSupplyItem[] = (matched as { product: InvProduct; qty: number }[]).map(
      ({ product, qty }) => {
        const batch = earliestBatch(product);
        const price = creditPriceOf(
          product,
          state.hospital.hospitalAccount,
          state.hospital.hospitalPriceRules,
        );
        return {
          productId: product.id,
          name: product.name,
          batchNo: batch?.batchNo ?? "—",
          expiry: batch?.expiry ?? "—",
          hsn: product.hsn,
          gst: product.gst,
          qty,
          price,
          amount: Math.round(qty * price * 100) / 100,
        };
      },
    );
    const supply = await api
      .dispatch(
        issueWardSupply({
          wardId: indent.wardId,
          wardName: indent.wardName,
          reason: "floor",
          items,
          refDoc: indent.id,
          indentId: indent.id,
        }),
      )
      .unwrap();
    return Boolean(supply);
  },
);
