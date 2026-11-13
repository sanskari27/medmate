import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { ReportBody } from "./model";

export type ReportQuery = {
  id: string;
  from?: string;
  to?: string;
};

export const reportsApi = createApi({
  reducerPath: "reportsApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    readReport: build.query<ReportBody, ReportQuery>({
      query: ({ id, from, to }) => ({
        url: `/pharmacy/reports/${id}`,
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
      }),
    }),
    exportReport: build.query<string, ReportQuery>({
      query: ({ id, from, to }) => ({
        url: `/pharmacy/reports/${id}/export`,
        params: {
          ...(from ? { from } : {}),
          ...(to ? { to } : {}),
        },
        responseHandler: "text" as const,
      }),
    }),
  }),
});

export const { useReadReportQuery, useLazyExportReportQuery } = reportsApi;
