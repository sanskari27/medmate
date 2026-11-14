import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/authentication";
import { catalogApi } from "@/features/catalog";
import { leadsApi } from "@/features/leads";
import { pharmaciesApi } from "@/features/pharmacies";
import { prepApi } from "@/features/prep";
import { reviewsApi } from "@/features/reviews";
import { supportApi } from "@/features/support";
import { readPersistedAuth } from "@/services/storage";
import { rootReducer } from "./rootReducer";

export function createAppStore() {
  const saved = readPersistedAuth();
  return configureStore({
    reducer: rootReducer,
    preloadedState: saved
      ? {
          auth: {
            session: saved.session,
            pinReset: saved.pinReset,
          },
        }
      : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        reviewsApi.middleware,
        pharmaciesApi.middleware,
        supportApi.middleware,
        leadsApi.middleware,
        catalogApi.middleware,
        prepApi.middleware,
      ),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
