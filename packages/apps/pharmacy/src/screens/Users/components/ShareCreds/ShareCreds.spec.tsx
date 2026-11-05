import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { StaffUser } from "@/utils";
import { ShareCreds } from "./ShareCreds";

describe("ShareCreds", () => {
  it("titles the share dialog with the staff name", () => {
    const user = { id: "u1", name: "Ravi", role: "Owner", phone: "", email: "", active: true, lastActiveMins: 0, pin: "1234", permissions: [] } as unknown as StaffUser;
    render(<ShareCreds user={user} pharmacy="Sri Sai Medicals" onClose={function close() {}} />);
    expect(screen.getByText("Share login with Ravi")).toBeTruthy();
  });
});
