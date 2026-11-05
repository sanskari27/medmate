import { describe, expect, it } from "vitest";
import { SalesRegister } from "./SalesRegister";

describe("SalesRegister", () => {
  it("exports the component", () => {
    expect(typeof SalesRegister).toBe("function");
  });
});
