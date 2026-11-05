import { createFieldSlice } from "@/app/store/createFieldSlice";

export type OrdersState = { focusId: string | null };

const ordersSlice = createFieldSlice<OrdersState>("orders", { focusId: null });
export const setOrdersField = ordersSlice.actions.setField;
export const ordersReducer = ordersSlice.reducer;
