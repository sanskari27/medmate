import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PhoneField } from "./PhoneField";

describe("PhoneField", () => {
  it("shows the country prefix beside the number field", () => {
    render(<PhoneField label="Mobile number" />);
    expect(screen.getByText("+91")).toBeTruthy();
    expect(screen.getByLabelText("Mobile number")).toBeTruthy();
  });
});
