import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { DistributorList, DistributorOne, DistributorPayload, PaymentPayload } from "./model";

export const distributorsApi = createApi({
  reducerPath: "distributorsApi",
  baseQuery: apiClient,
  tagTypes: ["Distributors"],
  endpoints: (build) => ({
    listDistributors: build.query<DistributorList, void>({
      query: () => ({ url: "/pharmacy/distributors" }),
      providesTags: ["Distributors"],
    }),
    createDistributor: build.mutation<DistributorOne, DistributorPayload>({
      query: (body) => ({ url: "/pharmacy/distributors", method: "POST", body }),
      invalidatesTags: ["Distributors"],
    }),
    updateDistributor: build.mutation<
      DistributorOne,
      { code: string; body: DistributorPayload | { active: false } }
    >({
      query: ({ code, body }) => ({
        url: `/pharmacy/distributors/${code}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Distributors"],
    }),
    recordPayment: build.mutation<DistributorOne, { code: string; body: PaymentPayload }>({
      query: ({ code, body }) => ({
        url: `/pharmacy/distributors/${code}/payments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Distributors"],
    }),
  }),
});

export const {
  useListDistributorsQuery,
  useCreateDistributorMutation,
  useUpdateDistributorMutation,
  useRecordPaymentMutation,
} = distributorsApi;
