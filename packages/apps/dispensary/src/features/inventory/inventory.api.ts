import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { InventoryList, InventoryProduct } from "./model";

export type InventoryQuery = {
  page?: number;
  size?: number;
  q?: string;
  filter?: string;
};

export const inventoryApi = createApi({
  reducerPath: "inventoryApi",
  baseQuery: apiClient,
  tagTypes: ["Inventory"],
  endpoints: (build) => ({
    listInventory: build.query<InventoryList, InventoryQuery | void>({
      query: (args) => ({
        url: "/pharmacy/inventory",
        params: {
          page: args?.page ?? 1,
          size: args?.size ?? 25,
          ...(args?.q ? { q: args.q } : {}),
          ...(args?.filter ? { filter: args.filter } : {}),
        },
      }),
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
    setLocation: build.mutation<
      { product: InventoryProduct },
      { productId: string; rack: string; rackAlt: string }
    >({
      query: ({ productId, rack, rackAlt }) => ({
        url: `/pharmacy/inventory/${encodeURIComponent(productId)}/location`,
        method: "PATCH",
        body: { rack, rackAlt },
      }),
      invalidatesTags: ["Inventory"],
    }),
  }),
});

export const {
  useListInventoryQuery,
  useLazyListInventoryQuery,
  useUpdateReorderMutation,
  useSetLocationMutation,
} = inventoryApi;
