import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { DashboardRange, DashboardSnapshot } from "./model";

export const dashboardApi = createApi({
  reducerPath: "dashboardApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    readDashboard: build.query<DashboardSnapshot, { range: DashboardRange }>({
      query: ({ range }) => ({
        url: "/pharmacy/dashboard",
        params: { range },
      }),
    }),
  }),
});

export const { useReadDashboardQuery } = dashboardApi;
