import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { OwnerDetail, OwnerSummary } from "../types";

export const pharmaciesApi = createApi({
  reducerPath: "pharmaciesApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    listOwners: build.query<OwnerSummary[], void>({
      query: () => ({ url: "/pharmacy-owners" }),
    }),
    ownerDetail: build.query<OwnerDetail, string>({
      query: (id) => ({ url: `/pharmacy-owners/${id}` }),
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
  useRequestBlockMutation,
  useDecideBlockMutation,
  useBlockOwnerMutation,
  useUnblockOwnerMutation,
  useReadDocumentQuery,
} = pharmaciesApi;
