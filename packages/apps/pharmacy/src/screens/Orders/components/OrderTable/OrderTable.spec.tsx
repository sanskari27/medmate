import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OrderTable } from "./OrderTable";

describe("OrderTable", () => {
  it("renders the empty view", () => {
    render(
      <OrderTable
        sales={[]}
        now={0}
        onOpen={ignore}
        onMarkPaid={ignore}
        onAdvance={ignore}
        onCancel={ignore}
        onPack={ignore}
        onShare={ignore}
      />,
    );
    expect(screen.getByText("No orders in this view.")).toBeTruthy();
  });
});

function ignore() {}
