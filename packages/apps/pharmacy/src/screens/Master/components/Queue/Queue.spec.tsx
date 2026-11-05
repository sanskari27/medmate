import { describe, expect, it } from "vitest";
import { Queue } from "./Queue";

describe("Queue", () => {
  it("exports the component", () => {
    expect(typeof Queue).toBe("function");
  });
});
