import { combineReducers } from "@reduxjs/toolkit";
import { authReducer } from "@/store/slices/auth";
import { billingReducer } from "@/store/slices/billing";
import { crmReducer } from "@/store/slices/crm";
import { customersReducer } from "@/store/slices/customers";
import { hospitalReducer } from "@/store/slices/hospital";
import { inventoryReducer } from "@/store/slices/inventory";
import { ordersReducer } from "@/store/slices/orders";
import { prescriptionsReducer } from "@/store/slices/prescriptions";
import { purchasesReducer } from "@/store/slices/purchases";
import { reportsReducer } from "@/store/slices/reports";
import { salesReducer } from "@/store/slices/sales";
import { uiReducer } from "@/store/slices/ui";

export const rootReducer = combineReducers({
  auth: authReducer,
  billing: billingReducer,
  crm: crmReducer,
  customers: customersReducer,
  hospital: hospitalReducer,
  inventory: inventoryReducer,
  orders: ordersReducer,
  prescriptions: prescriptionsReducer,
  purchases: purchasesReducer,
  reports: reportsReducer,
  sales: salesReducer,
  ui: uiReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
