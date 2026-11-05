import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/hooks", () => ({
  usePharma: () => ({
    users: [],
    addUser: vi.fn(),
    toggleUser: vi.fn(),
    updateUser: vi.fn(),
    subscription: { plan: "Starter" },
    extraSeats: 0,
    profile: { name: "Green Cross" },
  }),
}));

import UsersScreen from "./Users";

describe("Users", () => {
  it("renders staff access controls", () => {
    render(<UsersScreen />);
    expect(screen.getByRole("button", { name: "Add user" })).toBeTruthy();
    expect(screen.getByText("Staff & access control")).toBeTruthy();
  });
});
