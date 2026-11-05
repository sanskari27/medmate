import {
  EXPENSE_CATEGORIES,
  type Expense,
  type Purchase,
  type PurchaseOrder,
  type Supplier,
  type SupplyEntry,
} from "@/utils";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export type PurchasesState = {
  purchases: Purchase[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  supplyList: SupplyEntry[];
  expenses: Expense[];
  expenseCategories: string[];
};

const purchasesSlice = createFieldSlice<PurchasesState>("purchases", {
  purchases: [],
  purchaseOrders: [],
  suppliers: [],
  supplyList: [],
  expenses: [],
  expenseCategories: [...EXPENSE_CATEGORIES],
});
export const setPurchasesField = purchasesSlice.actions.setField;
export const purchasesReducer = purchasesSlice.reducer;
