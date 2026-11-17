import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { sendOtp, verifyOtp, setPin, signOut } from "./authThunks";

const session = { accessToken: "access", refreshToken: "refresh" };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("auth thunks", () => {
  it("sendOtp advances the step to otp", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({})),
    );
    const store = createAppStore();
    await store.dispatch(sendOtp({ phone: "123" }));
    expect(store.getState().auth.step).toBe("otp");
  });

  it("successful verifyOtp stores the session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json(session)),
    );
    const store = createAppStore();
    await store.dispatch(verifyOtp({ phone: "123", code: "0000" }));
    expect(store.getState().auth.session).toEqual(session);
  });

  it("successful PIN sign-in stores the session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({})),
    );
    const store = createAppStore();
    store.dispatch({ type: "auth/sessionStarted", payload: { session, pinReset: false } });
    await store.dispatch(setPin({ pin: "1234" }));
    expect(store.getState().auth.session).toEqual(session);
  });

  it("signOut clears the session and returns step to phone", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({})),
    );
    const store = createAppStore();
    store.dispatch({ type: "auth/sessionStarted", payload: { session, pinReset: false } });
    await store.dispatch(signOut());
    expect(store.getState().auth.session).toBeNull();
    expect(store.getState().auth.step).toBe("phone");
  });

  it("failed verify does not store a session", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ title: "bad" }, 400)),
    );
    const store = createAppStore();
    try {
      await store.dispatch(verifyOtp({ phone: "123", code: "0000" })).unwrap();
    } catch {
      /* expected */
    }
    expect(store.getState().auth.session).toBeNull();
  });
});
