import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { ExpenseDraft, ExpenseExport, ExpenseList } from "./model";
import { savedCategory } from "./model";

export type ExpenseQuery = {
  page: number;
  size: number;
  from: string;
  to: string;
  category?: string;
  q?: string;
};

export const expensesApi = createApi({
  reducerPath: "expensesApi",
  baseQuery: apiClient,
  tagTypes: ["Expenses"],
  endpoints: (build) => ({
    listExpenses: build.query<ExpenseList, ExpenseQuery>({
      query: ({ page, size, from, to, category, q }) => ({
        url: "/pharmacy/expenses",
        params: {
          page,
          size,
          from,
          to,
          ...(category && category !== "all" ? { category } : {}),
          ...(q ? { q } : {}),
        },
      }),
      providesTags: ["Expenses"],
    }),
    exportExpenses: build.query<ExpenseExport, Omit<ExpenseQuery, "page" | "size">>({
      query: ({ from, to, category, q }) => ({
        url: "/pharmacy/expenses/export",
        params: {
          from,
          to,
          ...(category && category !== "all" ? { category } : {}),
          ...(q ? { q } : {}),
        },
      }),
    }),
    createExpense: build.mutation<{ expense: ExpenseList["expenses"][number] }, ExpenseDraft>({
      query: (draft) => ({
        url: "/pharmacy/expenses",
        method: "POST",
        body: {
          spentOn: draft.spentOn,
          party: draft.party.trim(),
          category: savedCategory(draft),
          paymentMode: draft.paymentMode,
          amount: Number(draft.amount).toFixed(2),
          gst: draft.gst,
          note: draft.note.trim() || undefined,
        },
      }),
      invalidatesTags: ["Expenses"],
    }),
  }),
});

export const { useListExpensesQuery, useLazyExportExpensesQuery, useCreateExpenseMutation } =
  expensesApi;
