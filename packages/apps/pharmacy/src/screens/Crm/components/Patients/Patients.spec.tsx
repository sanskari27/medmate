import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { Patients } from "./Patients";

describe("Patients", () => {
  it("renders the empty CRM view", () => {
    render(<Patients view={emptyCrmView} />);
    expect(screen.getByText("No patients in this segment.")).toBeTruthy();
  });
});
