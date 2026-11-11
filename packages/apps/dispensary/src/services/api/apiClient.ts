import {
  fetchBaseQuery,
  type BaseQueryApi,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react";
import { API_PRODUCTION_ORIGIN, AUTH_SESSION_CLEARED, AUTH_SESSION_STARTED } from "@/constants";
import type { Session } from "@/types";
import { authEndpoints } from "./apiEndpoints";

export function apiBaseUrl(): string {
  if (import.meta.env.DEV && !import.meta.env.VITEST) return "";
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === "string" && configured.length > 0) {
    return configured.replace(/\/$/, "");
  }
  if (import.meta.env.VITEST) return "http://127.0.0.1:8080";
  return API_PRODUCTION_ORIGIN;
}

type AuthSliceState = {
  auth?: {
    pinReset?: boolean;
    session?: { accessToken?: string; refreshToken?: string } | null;
  };
};

const refreshSkipped = new Set<string>([
  authEndpoints.sendOtp,
  authEndpoints.verifyOtp,
  authEndpoints.pin,
  authEndpoints.signOut,
  authEndpoints.refresh,
  "/auth/admin-bootstrap",
]);

function requestPath(args: string | FetchArgs): string {
  const url = typeof args === "string" ? args : args.url;
  const query = url.indexOf("?");
  return query === -1 ? url : url.slice(0, query);
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as { accessToken?: unknown; refreshToken?: unknown };
  return typeof session.accessToken === "string" && typeof session.refreshToken === "string";
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl(),
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthSliceState).auth?.session?.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// An expired bearer is rejected before /auth/refresh runs.
const refreshBaseQuery = fetchBaseQuery({
  baseUrl: apiBaseUrl(),
});

let refreshing: Promise<boolean> | null = null;

async function refreshSession(api: BaseQueryApi): Promise<boolean> {
  const refreshToken = (api.getState() as AuthSliceState).auth?.session?.refreshToken;
  if (!refreshToken) {
    api.dispatch({ type: AUTH_SESSION_CLEARED });
    return false;
  }
  try {
    const result = await refreshBaseQuery(
      { url: authEndpoints.refresh, method: "POST", body: { refreshToken } },
      api,
      {},
    );
    if (result.error || !isSession(result.data)) {
      api.dispatch({ type: AUTH_SESSION_CLEARED });
      return false;
    }
    const pinReset = (api.getState() as AuthSliceState).auth?.pinReset ?? false;
    api.dispatch({
      type: AUTH_SESSION_STARTED,
      payload: { session: result.data, pinReset },
    });
    return true;
  } catch {
    api.dispatch({ type: AUTH_SESSION_CLEARED });
    return false;
  }
}

function refreshOnce(api: BaseQueryApi): Promise<boolean> {
  const current = refreshing;
  if (current) return current;
  const next = refreshSession(api).finally(() => {
    refreshing = null;
  });
  refreshing = next;
  return next;
}

export const apiClient: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status !== 401 || refreshSkipped.has(requestPath(args))) return result;
  const refreshed = await refreshOnce(api);
  if (!refreshed) return result;
  // The raw query does not refresh again when this retry is also 401.
  return rawBaseQuery(args, api, extraOptions);
};
