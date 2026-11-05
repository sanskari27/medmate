import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderReview } from "./OrderReview";

describe("OrderReview", () => {
  it("renders the order summary heading", () => {
    render(
      <OrderReview
        count={0}
        customer={{ name: "", phone: "", email: "", rxSource: "doctor", doctor: "" }}
        hasPrescriptionItem={false}
        isHospital={false}
        sourceLabel="Counter"
        source="counter"
        ward=""
        patientId=""
        lines={[]}
        inventory={[]}
        onEdit={ignore}
      />,
    );
    expect(screen.getByText(/Order summary/)).toBeTruthy();
    expect(screen.getByText("Walk-in")).toBeTruthy();
  });
});

function ignore() {}
