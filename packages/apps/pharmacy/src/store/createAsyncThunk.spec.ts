import { describe, expect, it } from "vitest";
import { createAsyncThunk } from "./createAsyncThunk";

describe("createAsyncThunk", () => {
  it("keeps the action name on the thunk that confirmation reads", () => {
    const saveBankAccount = createAsyncThunk(
      "auth/saveBankAccount",
      async (account: string) => account,
    );
    const action = saveBankAccount("HDFC") as unknown as { typePrefix?: string; arg: string };
    expect(action.typePrefix).toBe("auth/saveBankAccount");
    expect(action.arg).toBe("HDFC");
  });
});
