import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IconPos } from "@/components/atoms/Icon";
import { NavItem } from "./NavItem";

describe("NavItem", () => {
  it("marks the active item and shows a badge", () => {
    render(
      <NavItem active badge={2} icon={<IconPos size={19} />}>
        Orders
      </NavItem>,
    );
    const item = screen.getByRole("button", { name: /Orders/ });
    expect(item.getAttribute("aria-current")).toBe("page");
    expect(item.className.includes("text-white")).toBe(true);
    expect(screen.getByText("2")).toBeTruthy();
  });

  it("locks a premium item", () => {
    render(<NavItem locked>Reports</NavItem>);
    const item = screen.getByRole("button", { name: "Reports" });
    expect(item.getAttribute("title")).toBe("Premium feature — upgrade to unlock");
    expect(item.className.includes("opacity-[0.58]")).toBe(true);
  });
});
