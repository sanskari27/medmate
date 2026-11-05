import type { Prescription } from "@/utils";
import { createFieldSlice } from "@/store/createFieldSlice";

export type PrescriptionsState = { prescriptions: Prescription[] };

const prescriptionsSlice = createFieldSlice<PrescriptionsState>("prescriptions", {
  prescriptions: [],
});
export const setPrescriptionsField = prescriptionsSlice.actions.setField;
export const prescriptionsReducer = prescriptionsSlice.reducer;
