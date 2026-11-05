import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Prescription } from "@/utils";
import { RejectModal } from "./RejectModal";

describe("RejectModal", () => {
  it("names the prescription being rejected", () => {
    render(
      <RejectModal
        rx={{ id: "RX-9" } as Prescription}
        onClose={function close() {}}
        onConfirm={function confirm() {}}
      />,
    );
    expect(screen.getByText("Reject RX-9")).toBeTruthy();
  });
});
