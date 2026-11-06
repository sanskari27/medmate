import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { SaveConfirmContext } from "@/app/providers/PharmaProvider/saveConfirm";
import { store } from "@/store";
import type { SessionSnapshot } from "@/store/session";
import { loadSession } from "@/store/thunks/auth.thunk";
import PackOrder from "./PackOrder";

store.dispatch(
  loadSession.fulfilled(
    {
      sales: [
        {
          id: "INV-9",
          status: "accepted",
          channel: "online",
          customer: { name: "Asha" },
          items: [],
          discount: 0,
          fulfillment: { lines: [] },
        },
      ],
    } as unknown as SessionSnapshot,
    "test",
    undefined,
  ),
);

function renderPackOrder() {
  return render(
    <Provider store={store}>
      <SaveConfirmContext.Provider value={{ ask: () => Promise.resolve(true) }}>
        <PackOrder saleId="INV-9" onClose={ignore} />
      </SaveConfirmContext.Provider>
    </Provider>,
  );
}

describe("PackOrder", () => {
  it("renders the pack step", () => {
    renderPackOrder();
    expect(screen.getByText("Scan each medicine to pack")).toBeTruthy();
  });
});

function ignore() {}
