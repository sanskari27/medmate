import { createSlice } from "@reduxjs/toolkit";
import {
  EXPENSE_CATEGORIES,
  type Expense,
  type Purchase,
  type PurchaseOrder,
  type Supplier,
  type SupplyEntry,
} from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import {
  addExpenseCategory,
  markPurchaseOrderReceived,
  setPreferredSupply,
  updateExpense,
  updateSupplier,
  updateSupply,
} from "@/store/thunks/purchases.thunk";

export type PurchasesState = {
  purchases: Purchase[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  supplyList: SupplyEntry[];
  expenses: Expense[];
  expenseCategories: string[];
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: PurchasesState = {
  purchases: [],
  purchaseOrders: [],
  suppliers: [],
  supplyList: [],
  expenses: [],
  expenseCategories: [...EXPENSE_CATEGORIES],
  loading: false,
  loaded: false,
  saving: false,
  error: null,
};

function applyPurchases(state: PurchasesState, session: SessionSnapshot) {
  state.purchases = session.purchases || [];
  state.suppliers = session.suppliers || [];
  state.supplyList = session.supplyList || [];
  state.purchaseOrders = session.purchaseOrders || [];
  state.expenses = session.expenses || [];
  state.expenseCategories = session.expenseCategories || state.expenseCategories;
}

const purchasesSlice = createSlice({
  name: "purchases",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applyPurchases(state, action.payload);
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      .addCase(markPurchaseOrderReceived.fulfilled, (state, action) => {
        state.purchaseOrders = state.purchaseOrders.map((order) =>
          order.id === action.payload ? { ...order, status: "received" } : order,
        );
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.expenses = state.expenses.map((expense) =>
          expense.id === action.payload.id ? { ...expense, ...action.payload.patch } : expense,
        );
      })
      .addCase(addExpenseCategory.fulfilled, (state, action) => {
        if (!state.expenseCategories.includes(action.payload))
          state.expenseCategories.push(action.payload);
      })
      .addCase(updateSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.map((supplier) =>
          supplier.id === action.payload.id ? { ...supplier, ...action.payload.patch } : supplier,
        );
      })
      .addCase(updateSupply.fulfilled, (state, action) => {
        state.supplyList = state.supplyList.map((entry) =>
          entry.id === action.payload.id ? { ...entry, ...action.payload.patch } : entry,
        );
      })
      .addCase(setPreferredSupply.fulfilled, (state, action) => {
        const target = state.supplyList.find((entry) => entry.id === action.payload);
        if (!target) return;
        state.supplyList = state.supplyList.map((entry) =>
          entry.productId === target.productId
            ? { ...entry, preferred: entry.id === action.payload }
            : entry,
        );
      })
      .addCase(signOutRequest.fulfilled, () => initialState)
      .addMatcher(
        (action) => action.type.startsWith("purchases/") && action.type.endsWith("/pending"),
        (state) => {
          state.saving = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("purchases/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.saving = false;
          const payload = (action as { payload?: unknown }).payload;
          state.error = typeof payload === "string" ? payload : null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("purchases/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.saving = false;
        },
      );
  },
});

export default purchasesSlice.reducer;
