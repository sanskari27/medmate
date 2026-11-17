import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/features/auth";
import { api } from "@/services/api/api";
import { readPersistedAuth } from "@/services/storage";

export function createAppStore() {
  const saved = readPersistedAuth();
  return configureStore({
    reducer: {
      auth: authReducer,
      [api.reducerPath]: api.reducer,
    },
    preloadedState: saved ? { auth: saved } : undefined,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
  });
}

export const store = createAppStore();

export type AppStore = ReturnType<typeof createAppStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
