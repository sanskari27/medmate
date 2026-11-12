import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { InventoryProduct } from "./model";

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: apiClient,
  tagTypes: ["Inventory"],
  endpoints: (build) => ({
    listInventory: build.query<{ products: InventoryProduct[] }, void>({
      query: () => ({ url: "/pharmacy/inventory" }),
      providesTags: ["Inventory"],
    }),
    updateReorder: build.mutation<
      { product: InventoryProduct },
      { productId: string; reorderLevel: number }
    >({
      query: ({ productId, reorderLevel }) => ({
        url: `/pharmacy/inventory/${encodeURIComponent(productId)}`,
        method: "PATCH",
        body: { reorderLevel },
      }),
      invalidatesTags: ["Inventory"],
    }),
  }),
});

export const { useListInventoryQuery, useUpdateReorderMutation } = inventoryApi;
