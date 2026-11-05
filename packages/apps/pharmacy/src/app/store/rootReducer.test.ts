import { describe, expect, it } from "vitest";
import { setAuthField } from "@/store/slices/auth";
import { rootReducer } from "./rootReducer";

describe("rootReducer", () => {
  it("stores a session field on the auth slice", () => {
    const next = rootReducer(undefined, setAuthField({ key: "signedIn", value: true }));
    expect(next.auth.signedIn).toBe(true);
    expect(next.inventory.inventory).toEqual([]);
  });
});
