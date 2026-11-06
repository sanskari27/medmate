import { describe, expect, it } from "vitest";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { updateProduct } from "@/store/thunks/inventory.thunk";
import inventoryReducer from "@/store/slices/inventory.slice";

describe("inventory slice", () => {
  it("upserts a product when the update thunk fulfills", () => {
    const initial = inventoryReducer(undefined, { type: "init" });
    const withProduct = {
      ...initial,
      inventory: [{ id: "p1", name: "Paracetamol", batches: [] } as never],
    };
    const next = inventoryReducer(
      withProduct,
      updateProduct.fulfilled({ id: "p1", patch: { name: "Dolo" } }, "request", {
        id: "p1",
        patch: { name: "Dolo" },
      }),
    );
    expect(next.inventory[0].name).toBe("Dolo");
    expect(next.saving).toBe(false);
  });

  it("records a rejected update", () => {
    const initial = inventoryReducer(undefined, { type: "init" });
    const next = inventoryReducer(
      initial,
      updateProduct.rejected(
        null,
        "request",
        { id: "p1", patch: {} },
        "Could not update the product",
      ),
    );
    expect(next.error).toBe("Could not update the product");
    expect(next.saving).toBe(false);
  });

  it("sets the loading flag while the session is loading", () => {
    const next = inventoryReducer(undefined, loadSession.pending("session", undefined));
    expect(next.loadingInventory).toBe(true);
    expect(next.error).toBeNull();
  });

  it("returns the initial state after sign-out", () => {
    const loaded = inventoryReducer(
      undefined,
      loadSession.fulfilled({ inventory: [], racks: ["A1"] } as never, "session", undefined),
    );
    const next = inventoryReducer(
      loaded,
      signOutRequest.fulfilled(undefined, "sign-out", undefined),
    );
    expect(next).toEqual(inventoryReducer(undefined, { type: "init" }));
  });
});
