import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Text } from "@/components/atoms";
import { CardBody } from "./CardBody";

describe("CardBody", () => {
  it("renders body copy", () => {
    render(
      <CardBody>
        <Text>Line items</Text>
      </CardBody>,
    );
    expect(screen.getByText("Line items")).toBeTruthy();
  });
});
