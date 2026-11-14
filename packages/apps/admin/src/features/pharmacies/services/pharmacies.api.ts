import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { OwnerDetail, OwnerSummary, PharmacyFleet, PharmacyInsights } from "../types";

export const pharmaciesApi = createApi({
  reducerPath: "pharmaciesApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    listOwners: build.query<
      { owners: OwnerSummary[]; page: number; size: number; total: number },
      { page: number; size: number }
    >({
      query: ({ page, size }) => ({ url: "/pharmacy-owners", params: { page, size } }),
    }),
    ownerDetail: build.query<OwnerDetail, string>({
      query: (id) => ({ url: `/pharmacy-owners/${id}` }),
    }),
    pharmacyFleet: build.query<PharmacyFleet, void>({
      query: () => ({ url: "/pharmacy-insights" }),
    }),
    pharmacyInsights: build.query<PharmacyInsights, { id: string; range: string }>({
      query: ({ id, range }) => ({ url: `/pharmacy-insights/${id}`, params: { range } }),
    }),
    requestBlock: build.mutation<OwnerDetail, { id: string; reason: string }>({
      query: ({ id, reason }) => ({
        url: `/pharmacy-owners/${id}/block-requests`,
        method: "POST",
        body: { reason },
      }),
    }),
    decideBlock: build.mutation<
      OwnerDetail,
      { id: string; requestId: string; decision: "approve" | "reject" }
    >({
      query: ({ id, requestId, decision }) => ({
        url: `/pharmacy-owners/${id}/block-requests/${requestId}/decision`,
        method: "POST",
        body: { decision },
      }),
    }),
    blockOwner: build.mutation<OwnerDetail, string>({
      query: (id) => ({
        url: `/pharmacy-owners/${id}/block`,
        method: "POST",
      }),
    }),
    unblockOwner: build.mutation<OwnerDetail, string>({
      query: (id) => ({
        url: `/pharmacy-owners/${id}/unblock`,
        method: "POST",
      }),
    }),
    readDocument: build.query<Blob, string>({
      query: (url) => ({
        url,
        responseHandler: (response) => {
          if (!response.ok) throw new Error("Document was not read");
          return response.blob();
        },
      }),
    }),
  }),
});

export const {
  useListOwnersQuery,
  useOwnerDetailQuery,
  usePharmacyFleetQuery,
  usePharmacyInsightsQuery,
  useRequestBlockMutation,
  useDecideBlockMutation,
  useBlockOwnerMutation,
  useUnblockOwnerMutation,
  useReadDocumentQuery,
} = pharmaciesApi;
