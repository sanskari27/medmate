import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "@/features/authentication";
import { setupApi } from "@/features/setup";
import { readPersistedAuth } from "@/services/storage";
import { rootReducer } from "./rootReducer";

export function createAppStore() {
  const saved = readPersistedAuth();
  return configureStore({
    reducer: rootReducer,
    preloadedState: saved ? { auth: saved } : undefined,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(authApi.middleware, setupApi.middleware),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
