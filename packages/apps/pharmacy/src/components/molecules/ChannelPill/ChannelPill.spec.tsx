import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChannelPill } from "./ChannelPill";

describe("ChannelPill", () => {
  it("names online and counter sales", () => {
    const view = render(<ChannelPill channel="online" />);
    expect(screen.getByText("Online")).toBeTruthy();
    view.rerender(<ChannelPill channel="offline" />);
    expect(screen.getByText("Counter")).toBeTruthy();
  });
});
