import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "@/components/atoms/Text";
import { SegmentedControl } from "./SegmentedControl";

describe("SegmentedControl", () => {
  it("groups the options", () => {
    render(
      <SegmentedControl label="Range">
        <Text as="span">7D</Text>
      </SegmentedControl>,
    );
    expect(screen.getByRole("group", { name: "Range" })).toBeTruthy();
    expect(screen.getByText("7D")).toBeTruthy();
  });
});
