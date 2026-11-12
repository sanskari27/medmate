import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { SaleList, SaleOne } from "./model";

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: apiClient,
  tagTypes: ["Sales"],
  endpoints: (build) => ({
    listSales: build.query<SaleList, void>({
      query: () => ({ url: "/pharmacy/sales" }),
      providesTags: ["Sales"],
    }),
    readSale: build.query<SaleOne, string>({
      query: (id) => ({ url: `/pharmacy/sales/${encodeURIComponent(id)}` }),
      providesTags: ["Sales"],
    }),
    createReturn: build.mutation<SaleOne, { id: string; body: unknown }>({
      query: ({ id, body }) => ({
        url: `/pharmacy/sales/${encodeURIComponent(id)}/returns`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Sales"],
    }),
  }),
});

export const { useListSalesQuery, useReadSaleQuery, useCreateReturnMutation } = salesApi;
