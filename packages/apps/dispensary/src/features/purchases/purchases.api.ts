import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { MedicineHit, MedicineSnapshot, PurchaseList, PurchaseOne } from "./model";

export const purchasesApi = createApi({
  reducerPath: "purchasesApi",
  baseQuery: apiClient,
  tagTypes: ["Purchases"],
  endpoints: (build) => ({
    listPurchases: build.query<
      PurchaseList,
      {
        productId?: string;
        q?: string;
        from?: string;
        to?: string;
        distributorId?: string;
        page: number;
        size: number;
      }
    >({
      query: ({ productId, q, from, to, distributorId, page, size }) => ({
        url: "/pharmacy/purchases",
        params: {
          page,
          size,
          ...(productId ? { productId } : {}),
          ...(q ? { q } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(distributorId ? { distributorId } : {}),
        },
      }),
      providesTags: ["Purchases"],
    }),
    readPurchase: build.query<PurchaseOne, string>({
      query: (id) => ({ url: `/pharmacy/purchases/${encodeURIComponent(id)}` }),
      providesTags: ["Purchases"],
    }),
    createPurchase: build.mutation<PurchaseOne, unknown>({
      query: (body) => ({ url: "/pharmacy/purchases", method: "POST", body }),
      invalidatesTags: ["Purchases"],
    }),
    createReturn: build.mutation<PurchaseOne, { id: string; body: unknown }>({
      query: ({ id, body }) => ({ url: `/pharmacy/purchases/${id}/returns`, method: "POST", body }),
      invalidatesTags: ["Purchases"],
    }),
    searchMedicines: build.query<{ medicines: MedicineHit[] }, string>({
      query: (q) => ({ url: `/pharmacy/medicines/search?q=${encodeURIComponent(q)}` }),
    }),
    validateMedicines: build.mutation<
      { products: MedicineSnapshot[]; missing: string[]; ambiguous: string[] },
      { ids: string[] }
    >({
      query: (body) => ({ url: "/pharmacy/medicines/validate", method: "POST", body }),
    }),
  }),
});

export const {
  useListPurchasesQuery,
  useReadPurchaseQuery,
  useCreatePurchaseMutation,
  useCreateReturnMutation,
  useLazySearchMedicinesQuery,
  useValidateMedicinesMutation,
} = purchasesApi;
