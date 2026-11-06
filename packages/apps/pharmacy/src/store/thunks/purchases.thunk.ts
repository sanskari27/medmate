import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { purchasesService } from "@/services/api/endpoints/purchases";
import type { Expense, Purchase, PurchaseItem, Supplier, SupplyEntry } from "@/utils";
import { showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = { auth: { signedIn: boolean }; purchases: { supplyList: SupplyEntry[] } };
type Dispatch = ThunkDispatch<Gate, unknown, Action>;
const reload = (dispatch: Dispatch) => () => dispatch(loadSession()).unwrap();

export const receivePurchase = createAsyncThunk<
  Purchase,
  {
    supplierId: string;
    supplierName: string;
    invoiceNo: string;
    invoiceDate: string;
    items: PurchaseItem[];
  },
  { state: Gate; rejectValue: string }
>("purchases/receivePurchase", async (draft, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not receive the purchase",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      const result = await purchasesService.receivePurchase(draft);
      dispatch(showToast("Stock updated"));
      return result.purchase;
    },
  }),
);

export const sendPurchaseOrder = createAsyncThunk<
  {
    supplierId: string;
    supplierName: string;
    items: { productId: string; name: string; qty: number }[];
    note?: string;
  },
  {
    supplierId: string;
    supplierName: string;
    items: { productId: string; name: string; qty: number }[];
    note?: string;
  },
  { state: Gate; rejectValue: string }
>("purchases/sendPurchaseOrder", async (body, { dispatch, getState, rejectWithValue }) => {
  if (body.items.length === 0) return body;
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not send the purchase order",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.sendPurchaseOrder(body);
      dispatch(showToast("Purchase order sent to " + body.supplierName));
      return body;
    },
  });
});

export const importPurchaseOrders = createAsyncThunk<
  { created: number; skipped: string[] },
  { supplierName: string; productName: string; qty: number; note?: string }[],
  { state: Gate; rejectValue: string }
>("purchases/importPurchaseOrders", async (rows, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not import purchase orders",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      const result = await purchasesService.importPurchaseOrders(rows);
      dispatch(
        showToast(`Created ${result.created} purchase order${result.created === 1 ? "" : "s"}`),
      );
      return result;
    },
  }),
);

export const markPurchaseOrderReceived = createAsyncThunk<
  string,
  string,
  { state: Gate; rejectValue: string }
>("purchases/markPurchaseOrderReceived", async (id, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not mark the order received",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.markPurchaseOrderReceived(id);
      return id;
    },
  }),
);

export const addExpense = createAsyncThunk<
  Omit<Expense, "id" | "number">,
  Omit<Expense, "id" | "number">,
  { state: Gate; rejectValue: string }
>("purchases/addExpense", async (expense, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not record the expense",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.addExpense(expense);
      dispatch(
        showToast("Expense recorded · ₹" + Math.round(expense.amount).toLocaleString("en-IN")),
      );
      return expense;
    },
  }),
);

export const updateExpense = createAsyncThunk<
  { id: string; patch: Partial<Expense> },
  { id: string; patch: Partial<Expense> },
  { state: Gate; rejectValue: string }
>("purchases/updateExpense", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the expense",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.updateExpense(body.id, body.patch);
      return body;
    },
  }),
);

export const addExpenseCategory = createAsyncThunk<
  string,
  string,
  { state: Gate; rejectValue: string }
>("purchases/addExpenseCategory", async (name, { dispatch, getState, rejectWithValue }) => {
  const trimmed = name.trim();
  if (!trimmed) return rejectWithValue("Category name is required");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the category",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.addExpenseCategory(trimmed);
      dispatch(showToast("Category added"));
      return trimmed;
    },
  });
});

export const addSupplier = createAsyncThunk<
  Omit<Supplier, "id">,
  Omit<Supplier, "id">,
  { state: Gate; rejectValue: string }
>("purchases/addSupplier", async (supplier, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the supplier",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.addSupplier(supplier);
      dispatch(showToast(supplier.name + " added"));
      return supplier;
    },
  }),
);

export const updateSupplier = createAsyncThunk<
  { id: string; patch: Partial<Supplier> },
  { id: string; patch: Partial<Supplier> },
  { state: Gate; rejectValue: string }
>("purchases/updateSupplier", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the supplier",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.updateSupplier(body.id, body.patch);
      return body;
    },
  }),
);

export const addSupply = createAsyncThunk<
  Omit<SupplyEntry, "id">,
  Omit<SupplyEntry, "id">,
  { state: Gate; rejectValue: string }
>("purchases/addSupply", async (entry, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the supply item",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.addSupply(entry);
      dispatch(showToast("Supply item added"));
      return entry;
    },
  }),
);

export const updateSupply = createAsyncThunk<
  { id: string; patch: Partial<SupplyEntry> },
  { id: string; patch: Partial<SupplyEntry> },
  { state: Gate; rejectValue: string }
>("purchases/updateSupply", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the supply item",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.updateSupply(body.id, body.patch);
      return body;
    },
  }),
);

export const setPreferredSupply = createAsyncThunk<
  string,
  string,
  { state: Gate; rejectValue: string }
>("purchases/setPreferredSupply", async (id, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the preferred supply",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await purchasesService.setPreferredSupply(id);
      return id;
    },
  }),
);
