import { configureStore } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authReducer } from "@/features/auth/authSlice";
import { apiBaseUrl, apiClient } from "@/services/api/apiClient";

const session = { accessToken: "access", refreshToken: "refresh" };

const probeApi = createApi({
  reducerPath: "probeApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    call: build.mutation<{ ok: boolean }, { url: string }>({
      query: ({ url }) => ({ url, method: "POST", body: { ok: true } }),
    }),
  }),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [probeApi.reducerPath]: probeApi.reducer,
    },
    preloadedState: { auth: { session, pinReset: false, step: "phone" as const } },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(probeApi.middleware),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiClient", () => {
  it("sets Authorization from the auth slice", async () => {
    const seen: Array<string | null> = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = input instanceof Request ? input : new Request(input);
        seen.push(request.headers.get("Authorization"));
        return json({ ok: true });
      }),
    );

    const store = makeStore();
    await store.dispatch(probeApi.endpoints.call.initiate({ url: "/clinic-api/clinic/me" }));
    expect(seen[0]).toBe("Bearer access");
  });

  it("uses an empty base URL in development and the configured URL otherwise", () => {
    vi.stubEnv("DEV", true);
    vi.stubEnv("VITEST", "");
    expect(apiBaseUrl()).toBe("");

    vi.stubEnv("DEV", false);
    vi.stubEnv("VITEST", "");
    vi.stubEnv("VITE_API_BASE_URL", "https://api.nammamedmate.com/");
    expect(apiBaseUrl()).toBe("https://api.nammamedmate.com");
  });

  it("does not refresh on 401 for sign-in endpoints", async () => {
    let refreshCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = input instanceof Request ? input : new Request(input);
        if (request.url.includes("/auth/refresh")) refreshCalls += 1;
        return json({ title: "Unauthorized" }, 401);
      }),
    );

    const store = makeStore();
    for (const url of ["/auth/otp/send", "/auth/otp/verify", "/auth/pin/set"]) {
      await store.dispatch(probeApi.endpoints.call.initiate({ url }));
    }
    expect(refreshCalls).toBe(0);
  });
});
