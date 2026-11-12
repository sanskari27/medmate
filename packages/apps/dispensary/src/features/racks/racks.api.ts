import { createApi } from "@reduxjs/toolkit/query/react";
import { inventoryApi, type InventoryProduct } from "@/features/inventory";
import { apiClient } from "@/services/api";

export type RackList = {
  racks: string[];
  products: InventoryProduct[];
};

export const racksApi = createApi({
  reducerPath: "racksApi",
  baseQuery: apiClient,
  tagTypes: ["Racks"],
  endpoints: (build) => ({
    listRacks: build.query<RackList, void>({
      query: () => ({ url: "/pharmacy/racks" }),
      providesTags: ["Racks"],
    }),
    createRack: build.mutation<RackList, { rack: string }>({
      query: (body) => ({ url: "/pharmacy/racks", method: "POST", body }),
      invalidatesTags: ["Racks"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
      },
    }),
    setLocation: build.mutation<
      { product: InventoryProduct },
      { productId: string; rack?: string; rackAlt?: string }
    >({
      query: ({ productId, ...body }) => ({
        url: `/pharmacy/inventory/${encodeURIComponent(productId)}/location`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Racks"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
      },
    }),
    bulkAssign: build.mutation<RackList, { ids: string[]; rack: string }>({
      query: (body) => ({ url: "/pharmacy/inventory/location/bulk", method: "POST", body }),
      invalidatesTags: ["Racks"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          return;
        }
        dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
      },
    }),
  }),
});

export const {
  useListRacksQuery,
  useCreateRackMutation,
  useSetLocationMutation,
  useBulkAssignMutation,
} = racksApi;
