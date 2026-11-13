import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { CasePage, Faq, SupportCase, SupportMessage } from "./model";

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: apiClient,
  tagTypes: ["Faq", "Case"],
  endpoints: (build) => ({
    faqs: build.query<Faq[], void>({
      query: () => ({ url: "/support/faqs" }),
      providesTags: ["Faq"],
    }),
    cases: build.query<CasePage, { page: number; size: number }>({
      query: ({ page, size }) => ({ url: "/support/cases", params: { page, size } }),
      providesTags: ["Case"],
    }),
    caseDetail: build.query<SupportCase, string>({
      query: (id) => ({ url: `/support/cases/${id}` }),
      providesTags: ["Case"],
    }),
    createCase: build.mutation<
      SupportCase,
      { kind: "ticket" | "chat"; subject: string; category?: string; details?: string }
    >({
      query: (body) => ({ url: "/support/cases", method: "POST", body }),
      invalidatesTags: ["Case"],
    }),
    sendMessage: build.mutation<SupportMessage, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `/support/cases/${id}/messages`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Case"],
    }),
    resolveCase: build.mutation<SupportCase, string>({
      query: (id) => ({ url: `/support/cases/${id}/resolve`, method: "POST" }),
      invalidatesTags: ["Case"],
    }),
  }),
});

export const {
  useFaqsQuery,
  useCasesQuery,
  useCaseDetailQuery,
  useCreateCaseMutation,
  useSendMessageMutation,
  useResolveCaseMutation,
} = supportApi;
