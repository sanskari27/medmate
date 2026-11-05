import { describe, expect, it } from "vitest";
import { normalizeApiBaseUrl } from "./env";

describe("normalizeApiBaseUrl", () => {
  it("drops a trailing slash and treats a missing value as an empty origin", () => {
    expect(normalizeApiBaseUrl("https://api.nammamedmate.com/")).toBe(
      "https://api.nammamedmate.com",
    );
    expect(normalizeApiBaseUrl(undefined)).toBe("");
  });
});
