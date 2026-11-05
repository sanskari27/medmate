import { describe, expect, it } from "vitest";
import { Accounts } from "./Accounts";

describe("Accounts", () => {
  it("exports the component", () => {
    expect(typeof Accounts).toBe("function");
  });
});
