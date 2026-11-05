import { EMPTY_CRM, type CrmData } from "@/utils";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export type CrmState = { crm: CrmData };

const crmSlice = createFieldSlice<CrmState>("crm", { crm: EMPTY_CRM });
export const setCrmField = crmSlice.actions.setField;
export const crmReducer = crmSlice.reducer;
