import { combineReducers } from "@reduxjs/toolkit";
import { authApi, authReducer } from "@/features/authentication";
import { profileApi } from "@/features/profile";
import { setupApi } from "@/features/setup";
import { supportApi } from "@/features/support";
import { usersApi } from "@/features/users";
import { employeesApi } from "@/features/employees";
import { invoiceSettingsApi } from "@/features/invoice-settings";

export const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [setupApi.reducerPath]: setupApi.reducer,
  [supportApi.reducerPath]: supportApi.reducer,
  [profileApi.reducerPath]: profileApi.reducer,
  [usersApi.reducerPath]: usersApi.reducer,
  [employeesApi.reducerPath]: employeesApi.reducer,
  [invoiceSettingsApi.reducerPath]: invoiceSettingsApi.reducer,
});
