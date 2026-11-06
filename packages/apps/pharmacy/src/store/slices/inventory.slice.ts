import { createSlice } from "@reduxjs/toolkit";
import type { InvProduct } from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { checkoutPos } from "@/store/thunks/billing.thunk";
import {
  setOnlinePrice,
  setProductOffer,
  setProductSupplier,
  updateProduct,
} from "@/store/thunks/inventory.thunk";
import { placeKioskOrder } from "@/store/thunks/sales.thunk";

export type InventoryState = {
  inventory: InvProduct[];
  racks: string[];
  loadingInventory: boolean;
  inventoryLoaded: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: InventoryState = {
  inventory: [],
  racks: [],
  loadingInventory: false,
  inventoryLoaded: false,
  saving: false,
  error: null,
};

function applyInventory(state: InventoryState, session: SessionSnapshot) {
  state.inventory = session.inventory || [];
  state.racks = session.racks || [];
}

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.inventoryLoaded) state.loadingInventory = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applyInventory(state, action.payload);
        state.loadingInventory = false;
        state.inventoryLoaded = true;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loadingInventory = false;
        state.inventoryLoaded = true;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.inventory = state.inventory.map((product) =>
          product.id === action.payload.id ? { ...product, ...action.payload.patch } : product,
        );
      })
      .addCase(setOnlinePrice.fulfilled, (state, action) => {
        state.inventory = state.inventory.map((product) =>
          product.id === action.payload.id
            ? { ...product, onlinePrice: action.payload.price }
            : product,
        );
      })
      .addCase(setProductOffer.fulfilled, (state, action) => {
        state.inventory = state.inventory.map((product) =>
          product.id === action.payload.id
            ? { ...product, offerId: action.payload.offerId }
            : product,
        );
      })
      .addCase(setProductSupplier.fulfilled, (state, action) => {
        state.inventory = state.inventory.map((product) =>
          product.id === action.payload.id
            ? { ...product, supplierId: action.payload.supplierId }
            : product,
        );
      })
      .addCase(checkoutPos.fulfilled, (state, action) => {
        state.inventory = action.payload.inventory;
      })
      .addCase(placeKioskOrder.fulfilled, (state, action) => {
        state.inventory = action.payload.inventory;
      })
      .addCase(signOutRequest.fulfilled, () => initialState)
      .addMatcher(
        (action) => action.type.startsWith("inventory/") && action.type.endsWith("/pending"),
        (state) => {
          state.saving = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("inventory/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.saving = false;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("inventory/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.saving = false;
          const payload = (action as { payload?: unknown }).payload;
          state.error = typeof payload === "string" ? payload : "Save failed";
        },
      );
  },
});

export default inventorySlice.reducer;
