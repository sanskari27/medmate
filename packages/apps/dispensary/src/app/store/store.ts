import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/authentication";
import { profileApi } from "@/features/profile";
import { setupApi } from "@/features/setup";
import { supportApi } from "@/features/support";
import { usersApi } from "@/features/users";
import { employeesApi } from "@/features/employees";
import { doctorsApi } from "@/features/doctors";
import { departmentsApi } from "@/features/departments";
import { wardsApi } from "@/features/wards";
import { distributorsApi } from "@/features/distributors";
import { inventoryApi } from "@/features/inventory";
import { offersApi } from "@/features/offers";
import { racksApi } from "@/features/racks";
import { purchasesApi } from "@/features/purchases";
import { invoiceSettingsApi } from "@/features/invoice-settings";
import { billingApi } from "@/features/billing";
import { salesApi } from "@/features/sales";
import { patientsApi } from "@/features/patients";
import { expensesApi } from "@/features/expenses";
import { reportsApi } from "@/features/reports";
import { dashboardApi } from "@/features/dashboard";
import { readPersistedAuth } from "@/services/storage";
import { rootReducer } from "./rootReducer";

export function createAppStore() {
  const saved = readPersistedAuth();
  return configureStore({
    reducer: rootReducer,
    preloadedState: saved ? { auth: saved } : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        setupApi.middleware,
        supportApi.middleware,
        profileApi.middleware,
        usersApi.middleware,
        employeesApi.middleware,
        doctorsApi.middleware,
        departmentsApi.middleware,
        wardsApi.middleware,
        distributorsApi.middleware,
        purchasesApi.middleware,
        inventoryApi.middleware,
        racksApi.middleware,
        offersApi.middleware,
        invoiceSettingsApi.middleware,
        billingApi.middleware,
        salesApi.middleware,
        patientsApi.middleware,
        expensesApi.middleware,
        reportsApi.middleware,
        dashboardApi.middleware,
      ),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
