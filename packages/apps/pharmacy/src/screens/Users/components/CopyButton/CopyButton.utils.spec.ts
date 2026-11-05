import { describe, expect, it, vi } from "vitest";
import { copyText } from "./CopyButton.utils";

describe("copyText", () => {
  it("writes the text and calls done when the clipboard resolves", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    const done = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    copyText("ABC-123", done);
    await Promise.resolve();
    expect(writeText.mock.calls[0]?.[0]).toBe("ABC-123");
    expect(done.mock.calls.length).toBe(1);
  });

  it("calls done when the clipboard rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const done = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    copyText("ABC-123", done);
    await Promise.resolve();
    expect(done.mock.calls.length).toBe(1);
  });
});
