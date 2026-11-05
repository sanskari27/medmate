import type { InvProduct } from "@/utils";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export type InventoryState = { inventory: InvProduct[]; racks: string[] };

const inventorySlice = createFieldSlice<InventoryState>("inventory", { inventory: [], racks: [] });
export const setInventoryField = inventorySlice.actions.setField;
export const inventoryReducer = inventorySlice.reducer;
