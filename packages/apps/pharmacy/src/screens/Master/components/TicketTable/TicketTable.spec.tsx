import { describe, expect, it } from "vitest";
import { TicketTable } from "./TicketTable";

describe("TicketTable", () => {
  it("exports the component", () => {
    expect(typeof TicketTable).toBe("function");
  });
});
