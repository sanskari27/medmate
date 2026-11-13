import { combineReducers } from "@reduxjs/toolkit";
import { authApi, authReducer } from "@/features/authentication";
import { profileApi } from "@/features/profile";
import { setupApi } from "@/features/setup";
import { supportApi } from "@/features/support";
import { usersApi } from "@/features/users";
import { employeesApi } from "@/features/employees";
import { distributorsApi } from "@/features/distributors";
import { inventoryApi } from "@/features/inventory";
import { offersApi } from "@/features/offers";
import { racksApi } from "@/features/racks";
import { purchasesApi } from "@/features/purchases";
import { invoiceSettingsApi } from "@/features/invoice-settings";
import { billingApi, billingReducer } from "@/features/billing";
import { salesApi } from "@/features/sales";
import { patientsApi } from "@/features/patients";
import { expensesApi } from "@/features/expenses";
import { reportsApi } from "@/features/reports";
import { dashboardApi } from "@/features/dashboard";

export const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [setupApi.reducerPath]: setupApi.reducer,
  [supportApi.reducerPath]: supportApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [employeesApi.reducerPath]: employeesApi.reducer,
  [distributorsApi.reducerPath]: distributorsApi.reducer,
  [purchasesApi.reducerPath]: purchasesApi.reducer,
  [inventoryApi.reducerPath]: inventoryApi.reducer,
  [racksApi.reducerPath]: racksApi.reducer,
  [offersApi.reducerPath]: offersApi.reducer,
  [invoiceSettingsApi.reducerPath]: invoiceSettingsApi.reducer,
  billing: billingReducer,
  [billingApi.reducerPath]: billingApi.reducer,
  [salesApi.reducerPath]: salesApi.reducer,
  [patientsApi.reducerPath]: patientsApi.reducer,
  [expensesApi.reducerPath]: expensesApi.reducer,
  [reportsApi.reducerPath]: reportsApi.reducer,
  [dashboardApi.reducerPath]: dashboardApi.reducer,
});
