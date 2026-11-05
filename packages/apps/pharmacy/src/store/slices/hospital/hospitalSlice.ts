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
import { createFieldSlice } from "@/store/createFieldSlice";

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
};

const hospitalSlice = createFieldSlice<HospitalState>("hospital", {
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
});
export const setHospitalField = hospitalSlice.actions.setField;
export const hospitalReducer = hospitalSlice.reducer;
