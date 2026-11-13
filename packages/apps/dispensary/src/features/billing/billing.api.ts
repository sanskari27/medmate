import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import { inventoryApi } from "@/features/inventory";
import type { PostedBill } from "./billing.slice";
import type { Discount } from "./model";

export type BillPayload = {
  patientName: string;
  patientPhone: string;
  prescribedBy: string;
  prescriptionNumber: string;
  payMode: "cash" | "credit";
  discount: Discount;
  lines: { productId: string; batchNo: string; qty: number; discount: Discount }[];
};

export const billingApi = createApi({
  reducerPath: "billingApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    createBill: build.mutation<{ bill: PostedBill }, BillPayload>({
      query: (body) => ({ url: "/pharmacy/bills", method: "POST", body }),
      async onQueryStarted(_body, { dispatch, queryFulfilled }) {
        await queryFulfilled;
        dispatch(inventoryApi.util.invalidateTags(["Inventory"]));
      },
    }),
  }),
});

export const { useCreateBillMutation } = billingApi;
