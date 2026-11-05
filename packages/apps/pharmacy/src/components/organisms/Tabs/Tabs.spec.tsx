import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Tab, Tabs } from "./Tabs";

describe("Tabs", () => {
  it("marks the selected tab", () => {
    render(
      <Tabs label="Orders">
        <Tab selected>Open</Tab>
        <Tab>Closed</Tab>
      </Tabs>,
    );
    const open = screen.getByRole("tab", { name: "Open" });
    expect(open.getAttribute("aria-selected")).toBe("true");
    expect(open.className).toContain("text-mid");
    expect(screen.getByRole("tablist", { name: "Orders" })).toBeTruthy();
  });
});
