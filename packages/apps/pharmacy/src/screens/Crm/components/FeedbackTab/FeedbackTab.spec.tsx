import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyCrmView } from "../crmView";
import { FeedbackTab } from "./FeedbackTab";

describe("FeedbackTab", () => {
  it("renders the empty CRM view", () => {
    render(<FeedbackTab view={emptyCrmView} />);
    expect(screen.getByText("No feedback yet.")).toBeTruthy();
  });
});
