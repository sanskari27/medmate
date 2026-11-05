import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CustomerBar } from "./CustomerBar";

describe("CustomerBar", () => {
  it("renders the walk-in name field", () => {
    render(
      <CustomerBar
        customer={{ name: "", phone: "", email: "", rxSource: "doctor", doctor: "" }}
        hasPrescriptionItem={false}
        prescriptionReady
        onName={ignore}
        onPhone={ignore}
        onDoctor={ignore}
      />,
    );
    expect(screen.getByPlaceholderText("Name (walk-in)")).toBeTruthy();
  });
});

function ignore() {}
