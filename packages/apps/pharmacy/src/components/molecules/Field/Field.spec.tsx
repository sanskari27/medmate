import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "@/components/atoms";
import { Field } from "./Field";

describe("Field", () => {
  it("shows the error instead of the hint", () => {
    render(
      <Field label="Phone" hint="10 digits" error="Required">
        <Text>control</Text>
      </Field>,
    );
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.queryByText("10 digits")).toBeNull();
  });
});
