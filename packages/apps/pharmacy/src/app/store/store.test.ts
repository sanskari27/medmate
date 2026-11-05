import { describe, expect, it } from "vitest";
import { setInventoryField } from "@/store/slices/inventory";
import { selectInventory } from "@/store/selectors";
import { store } from "./store";

describe("store", () => {
  it("dispatches a slice update", () => {
    store.dispatch(setInventoryField({ key: "racks", value: ["A1"] }));
    expect(store.getState().inventory.racks).toEqual(["A1"]);
    expect(selectInventory(store.getState())).toEqual([]);
  });
});
