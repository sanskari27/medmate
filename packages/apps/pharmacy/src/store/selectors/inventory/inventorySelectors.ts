import type { RootState } from "@/app/store/rootReducer";

export const selectInventory = (state: RootState) => state.inventory.inventory;
export const selectRacks = (state: RootState) => state.inventory.racks;
