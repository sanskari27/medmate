import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { UserModal } from "./UserModal";

describe("UserModal", () => {
  it("opens the add-member form", () => {
    render(
      <UserModal
        user={null}
        onClose={function close() {}}
        onSave={async function save() { return null; }}
        onShare={function share() {}}
      />,
    );
    expect(screen.getByText("Add team member")).toBeTruthy();
  });
});
