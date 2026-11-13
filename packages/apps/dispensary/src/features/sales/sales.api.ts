import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { SaleList, SaleOne } from "./model";

export const salesApi = createApi({
  reducerPath: "salesApi",
  baseQuery: apiClient,
  tagTypes: ["Sales"],
  endpoints: (build) => ({
    listSales: build.query<
      SaleList,
      { page: number; size: number; q?: string; from?: string; to?: string; type?: string }
    >({
      query: ({ page, size, q, from, to, type }) => ({
        url: "/pharmacy/sales",
        params: {
          page,
          size,
          ...(q ? { q } : {}),
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
          ...(type ? { type } : {}),
        },
      }),
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
