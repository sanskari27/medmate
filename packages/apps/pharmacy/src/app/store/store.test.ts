import { describe, expect, it } from "vitest";
import { loadSession } from "@/store/thunks/auth.thunk";
import type { SessionSnapshot } from "@/store/session";
import { store } from "./store";

describe("store", () => {
  it("hydrates inventory from the session snapshot", () => {
    store.dispatch(
      loadSession.fulfilled(
        { inventory: [], racks: ["A1"] } as unknown as SessionSnapshot,
        "session-test",
        undefined,
      ),
    );
    expect(store.getState().inventory.racks).toEqual(["A1"]);
    expect(store.getState().inventory.inventory).toEqual([]);
    expect(store.getState().auth.signedIn).toBe(true);
  });
});
