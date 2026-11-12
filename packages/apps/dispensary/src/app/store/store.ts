import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/authentication";
import { profileApi } from "@/features/profile";
import { setupApi } from "@/features/setup";
import { supportApi } from "@/features/support";
import { usersApi } from "@/features/users";
import { employeesApi } from "@/features/employees";
import { distributorsApi } from "@/features/distributors";
import { inventoryApi } from "@/features/inventory";
import { purchasesApi } from "@/features/purchases";
import { invoiceSettingsApi } from "@/features/invoice-settings";
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
        distributorsApi.middleware,
        purchasesApi.middleware,
        inventoryApi.middleware,
        invoiceSettingsApi.middleware,
      ),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
