import { describe, expect, it } from "vitest";
import { loadSession } from "@/store/thunks/auth.thunk";
import type { SessionSnapshot } from "@/store/session";
import { rootReducer } from "./rootReducer";

describe("rootReducer", () => {
  it("stores the signed-in session on the auth slice", () => {
    const next = rootReducer(
      undefined,
      loadSession.fulfilled(
        { businessType: "pharmacy", setupComplete: true, needsPin: false } as SessionSnapshot,
        "session-test",
        undefined,
      ),
    );
    expect(next.auth.signedIn).toBe(true);
    expect(next.auth.setupComplete).toBe(true);
    expect(next.inventory.inventory).toEqual([]);
  });
});
