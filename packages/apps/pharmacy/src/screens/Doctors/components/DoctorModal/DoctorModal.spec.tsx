import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DoctorModal } from "./DoctorModal";

describe("DoctorModal", () => {
  it("opens the add-doctor form", () => {
    render(
      <DoctorModal
        initial={null}
        departments={["OPD"]}
        onClose={function close() {}}
        onSave={function save() {}}
      />,
    );
    expect(screen.getByRole("heading", { name: "Add doctor" })).toBeTruthy();
  });
});
