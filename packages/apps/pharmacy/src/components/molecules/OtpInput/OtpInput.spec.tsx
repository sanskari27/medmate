import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  it("is a centred one-time code field", () => {
    render(<OtpInput length={4} aria-label="OTP" />);
    const input = screen.getByLabelText("OTP") as HTMLInputElement;
    expect(input.maxLength).toBe(4);
    expect(input.getAttribute("data-slot")).toBe("otp-input");
    expect(input.className.includes("tracking-[0.28em]")).toBe(true);
    expect(input.autocomplete).toBe("one-time-code");
  });
});
