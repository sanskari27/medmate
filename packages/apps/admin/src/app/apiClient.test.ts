import { configureStore } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { authReducer } from "@/features/authentication";
import { apiClient } from "@/services/api";
import type { Session } from "@/types";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "admin",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const rotated: Session = {
  ...session,
  accessToken: "next-access",
  refreshToken: "next-refresh",
};

const probeApi = createApi({
  reducerPath: "probeApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    call: build.mutation<{ ok: boolean }, { url: string }>({
      query: ({ url }) => ({ url, method: "POST", body: { ok: true } }),
    }),
  }),
});

type Seen = { url: string; authorization: string | null; body: unknown };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function asRequest(input: RequestInfo | URL): Request {
  return input instanceof Request ? input : new Request(input);
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeStore(pinReset = false) {
  return configureStore({
    reducer: {
      auth: authReducer,
      [probeApi.reducerPath]: probeApi.reducer,
    },
    preloadedState: { auth: { session, pinReset } },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(probeApi.middleware),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiClient", () => {
  it("refreshes once and retries with the new access token", async () => {
    const seen: Seen[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = asRequest(input);
        const body = request.method === "POST" ? await request.clone().json() : null;
        seen.push({ url: request.url, authorization: request.headers.get("Authorization"), body });
        if (request.url.includes("/auth/refresh")) return json(rotated);
        if (seen.filter((call) => call.url.includes("/ping")).length === 1) {
          return json({ title: "Unauthorized" }, 401);
        }
        return json({ ok: true });
      }),
    );

    const store = makeStore(true);
    const result = await store.dispatch(probeApi.endpoints.call.initiate({ url: "/ping" }));

    const refresh = seen.filter((call) => call.url.includes("/auth/refresh"));
    const pings = seen.filter((call) => call.url.includes("/ping"));
    expect(refresh).toHaveLength(1);
    expect(refresh[0]?.authorization).toBeNull();
    expect(refresh[0]?.body).toEqual({ refreshToken: "refresh" });
    expect(pings.map((call) => call.authorization)).toEqual([
      "Bearer access",
      "Bearer next-access",
    ]);
    expect(result).toMatchObject({ data: { ok: true } });
    expect(store.getState().auth.session?.refreshToken).toBe("next-refresh");
    expect(store.getState().auth.pinReset).toBe(true);
  });

  it("shares one refresh across overlapping 401s", async () => {
    let pingCalls = 0;
    let refreshCalls = 0;
    let releaseFirstAttempts = () => {};
    let releaseRefresh = () => {};
    const firstAttempts = new Promise<void>((resolve) => {
      releaseFirstAttempts = resolve;
    });
    const refreshHeld = new Promise<void>((resolve) => {
      releaseRefresh = resolve;
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = asRequest(input);
        if (request.url.includes("/auth/refresh")) {
          refreshCalls += 1;
          await refreshHeld;
          return json(rotated);
        }
        pingCalls += 1;
        if (pingCalls <= 2) {
          await firstAttempts;
          return json({ title: "Unauthorized" }, 401);
        }
        return json({ ok: true });
      }),
    );

    const store = makeStore();
    const first = store.dispatch(probeApi.endpoints.call.initiate({ url: "/ping/a" }));
    const second = store.dispatch(probeApi.endpoints.call.initiate({ url: "/ping/b" }));
    try {
      await flush();
      expect(pingCalls).toBe(2);
      releaseFirstAttempts();
      await flush();
      expect(refreshCalls).toBe(1);
      releaseRefresh();
      const [left, right] = await Promise.all([first, second]);
      expect(refreshCalls).toBe(1);
      expect(pingCalls).toBe(4);
      expect(left).toMatchObject({ data: { ok: true } });
      expect(right).toMatchObject({ data: { ok: true } });
    } finally {
      releaseFirstAttempts();
      releaseRefresh();
    }
  });

  it("clears the session when refresh fails and does not retry", async () => {
    let pingCalls = 0;
    let refreshCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = asRequest(input);
        if (request.url.includes("/auth/refresh")) {
          refreshCalls += 1;
          return json({ title: "Unauthorized" }, 401);
        }
        pingCalls += 1;
        return json({ title: "Unauthorized" }, 401);
      }),
    );

    const store = makeStore();
    const result = await store.dispatch(probeApi.endpoints.call.initiate({ url: "/ping" }));

    expect(refreshCalls).toBe(1);
    expect(pingCalls).toBe(1);
    expect(result).toMatchObject({ error: { status: 401 } });
    expect(store.getState().auth.session).toBeNull();
  });

  it("does not refresh again when the retry is still 401", async () => {
    let pingCalls = 0;
    let refreshCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = asRequest(input);
        if (request.url.includes("/auth/refresh")) {
          refreshCalls += 1;
          return json(rotated);
        }
        pingCalls += 1;
        return json({ title: "Unauthorized" }, 401);
      }),
    );

    const store = makeStore();
    const result = await store.dispatch(probeApi.endpoints.call.initiate({ url: "/ping" }));

    expect(refreshCalls).toBe(1);
    expect(pingCalls).toBe(2);
    expect(result).toMatchObject({ error: { status: 401 } });
    expect(store.getState().auth.session?.accessToken).toBe("next-access");
  });

  it("does not refresh or clear the session for a rejected OTP", async () => {
    let refreshCalls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = asRequest(input);
        if (request.url.includes("/auth/refresh")) refreshCalls += 1;
        return json({ title: "Unauthorized", detail: "Code was not accepted" }, 401);
      }),
    );

    const store = makeStore(true);
    const result = await store.dispatch(
      probeApi.endpoints.call.initiate({ url: "/auth/otp/verify" }),
    );

    expect(refreshCalls).toBe(0);
    expect(result).toMatchObject({ error: { status: 401 } });
    expect(store.getState().auth.session?.refreshToken).toBe("refresh");
    expect(store.getState().auth.pinReset).toBe(true);
  });
});
