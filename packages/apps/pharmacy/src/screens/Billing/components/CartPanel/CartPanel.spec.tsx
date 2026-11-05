import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CartPanel } from "./CartPanel";

describe("CartPanel", () => {
  it("shows the empty cart prompt", () => {
    render(
      <CartPanel
        count={0}
        itemCount={0}
        payable={0}
        canProceed={false}
        prescriptionReady
        onClear={ignore}
        onProceed={ignore}
        lines={[]}
        onDecrease={ignore}
        onIncrease={ignore}
        onQuantity={ignore}
        onRemove={ignore}
        onBatch={ignore}
        customer={null}
        source={null}
      />,
    );
    expect(screen.getByText("Scan or tap a medicine to start billing.")).toBeTruthy();
  });
});

function ignore() {}
