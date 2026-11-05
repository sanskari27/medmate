import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Modal } from "./Modal";

describe("Modal", () => {
  it("renders a labelled dialog", () => {
    render(
      <Modal title="Reject prescription" onClose={closeModal}>
        Reason
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Reject prescription" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
  });
});

function closeModal() {}
