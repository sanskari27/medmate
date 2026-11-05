import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SaleSourcePicker } from "./SaleSourcePicker";

describe("SaleSourcePicker", () => {
  it("renders the counter source", () => {
    render(
      <SaleSourcePicker
        sources={[{ key: "counter", short: "Counter" }]}
        source="counter"
        ward=""
        wards={[]}
        patientId=""
        onSource={ignore}
        onWard={ignore}
        onPatientId={ignore}
      />,
    );
    expect(screen.getByRole("button", { name: "Counter" })).toBeTruthy();
  });
});

function ignore() {}
