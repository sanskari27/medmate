import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IconCheck } from "@/components/atoms/Icon";
import { FeatureRow } from "./FeatureRow";

describe("FeatureRow", () => {
  it("toggles the feature switch", () => {
    const onClick = vi.fn();
    render(
      <FeatureRow ico={<IconCheck size={16} />} t="Khata" s="Credit sales" on onClick={onClick} />,
    );
    expect(screen.getByText("Credit sales")).toBeTruthy();
    fireEvent.click(screen.getByRole("switch", { name: "Khata" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
