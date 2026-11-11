import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { DecisionRoute } from "../reviewModel";
import type { ApplicationDetail, ApplicationSummary, DecisionBody, WaitingStatus } from "../types";

export const reviewsApi = createApi({
  reducerPath: "reviewsApi",
  baseQuery: apiClient,
  tagTypes: ["Application"],
  endpoints: (build) => ({
    listApplications: build.query<ApplicationSummary[], WaitingStatus>({
      query: (status) => ({ url: "/pharmacy-applications", params: { status } }),
      providesTags: ["Application"],
    }),
    applicationDetail: build.query<ApplicationDetail, string>({
      query: (id) => ({ url: `/pharmacy-applications/${id}` }),
    }),
    decide: build.mutation<unknown, { id: string; route: DecisionRoute; body: DecisionBody }>({
      query: ({ id, route, body }) => ({
        url: `/pharmacy-applications/${id}/${route}`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Application"],
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
  useListApplicationsQuery,
  useApplicationDetailQuery,
  useDecideMutation,
  useReadDocumentQuery,
} = reviewsApi;
