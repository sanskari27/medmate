import { createFieldSlice } from "@/app/store/createFieldSlice";

export type ReportsState = { reportTarget: string | null };

const reportsSlice = createFieldSlice<ReportsState>("reports", { reportTarget: null });
export const setReportsField = reportsSlice.actions.setField;
export const reportsReducer = reportsSlice.reducer;
