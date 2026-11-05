import { describe, expect, it } from "vitest";
import { matchingFaqs } from "./Support.utils";

describe("matchingFaqs", () => {
  it("returns every question when the query is blank and matches text otherwise", () => {
    const faqs = [{ q: "How is GST calculated?", a: "Inclusive MRP" }];
    expect(matchingFaqs(faqs, "  ")).toEqual(faqs);
    expect(matchingFaqs(faqs, "gst")).toEqual(faqs);
    expect(matchingFaqs(faqs, "reorder")).toEqual([]);
  });
});
