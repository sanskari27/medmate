import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "@/components/atoms";
import { Card, CardBody, CardHeader } from "./Card";

describe("Card", () => {
  it("renders a titled surface", () => {
    render(
      <Card>
        <CardHeader title="Stock" subtitle="Today" />
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Stock" })).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
  });

  it("renders header actions and body copy", () => {
    render(
      <Card>
        <CardHeader title="Bills" actions={<Text>Export</Text>} />
        <CardBody>
          <Text>Line items</Text>
        </CardBody>
      </Card>,
    );
    expect(screen.getByRole("heading", { name: "Bills" })).toBeTruthy();
    expect(screen.getByText("Export")).toBeTruthy();
    expect(screen.getByText("Line items")).toBeTruthy();
  });
});
