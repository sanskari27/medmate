import { describe, expect, it } from "vitest";
import { accountsWithBalance } from "./Khata.utils";

describe("accountsWithBalance", () => {
  it("drops settled accounts", () => {
    expect(accountsWithBalance([{ outstanding: 10 }, { outstanding: 0 }])).toEqual([
      { outstanding: 10 },
    ]);
  });
});
