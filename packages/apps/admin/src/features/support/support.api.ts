import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { Faq, SupportCase, SupportMessage } from "./model";

export const supportApi = createApi({
  reducerPath: "supportApi",
  baseQuery: apiClient,
  tagTypes: ["Faq", "Case"],
  endpoints: (build) => ({
    faqs: build.query<Faq[], void>({
      query: () => ({ url: "/support/faqs" }),
      providesTags: ["Faq"],
    }),
    cases: build.query<SupportCase[], void>({
      query: () => ({ url: "/support/cases" }),
      providesTags: ["Case"],
    }),
    caseDetail: build.query<SupportCase, string>({
      query: (id) => ({ url: `/support/cases/${id}` }),
      providesTags: ["Case"],
    }),
    createFaq: build.mutation<Faq, { question: string; answer: string }>({
      query: (body) => ({ url: "/support/faqs", method: "POST", body }),
      invalidatesTags: ["Faq"],
    }),
    updateFaq: build.mutation<
      Faq,
      { id: string; question: string; answer: string; published: boolean }
    >({
      query: ({ id, ...body }) => ({ url: `/support/faqs/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Faq"],
    }),
    reorderFaqs: build.mutation<Faq[], string[]>({
      query: (ids) => ({ url: "/support/faqs/order", method: "POST", body: { ids } }),
      invalidatesTags: ["Faq"],
    }),
    sendMessage: build.mutation<SupportMessage, { id: string; text: string }>({
      query: ({ id, text }) => ({
        url: `/support/cases/${id}/messages`,
        method: "POST",
        body: { text },
      }),
      invalidatesTags: ["Case"],
    }),
    claimCase: build.mutation<SupportCase, string>({
      query: (id) => ({ url: `/support/cases/${id}/claim`, method: "POST" }),
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
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useReorderFaqsMutation,
  useSendMessageMutation,
  useClaimCaseMutation,
  useResolveCaseMutation,
} = supportApi;
