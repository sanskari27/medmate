import { describe, expect, it } from "vitest";
import { subscriptionStatusLabel } from "./Subscription.utils";

describe("subscriptionStatusLabel", () => {
  it("shows expired once the subscription has lapsed", () => {
    expect(subscriptionStatusLabel(true, "active")).toBe("expired");
    expect(subscriptionStatusLabel(false, "active")).toBe("active");
  });
});
