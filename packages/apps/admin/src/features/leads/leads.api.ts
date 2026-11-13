import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { Lead, LeadFilters, LeadPage, LeadStatus } from "./model";

export type LeadQuery = LeadFilters & { page: number; size: number };

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: apiClient,
  tagTypes: ["Lead"],
  endpoints: (build) => ({
    listLeads: build.query<LeadPage, LeadQuery>({
      query: ({ page, size, status, site, type }) => {
        const params: Record<string, string | number> = { page, size };
        if (status) params.status = status;
        if (site) params.site = site;
        if (type) params.type = type;
        return { url: "/api/v1/leads", params };
      },
      providesTags: ["Lead"],
    }),
    leadDetail: build.query<{ lead: Lead }, string>({
      query: (id) => ({ url: `/api/v1/leads/${id}` }),
      providesTags: ["Lead"],
    }),
    markLead: build.mutation<{ lead: Lead }, { id: string; status: LeadStatus }>({
      query: ({ id, status }) => ({
        url: `/api/v1/leads/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Lead"],
    }),
  }),
});

export const { useListLeadsQuery, useLeadDetailQuery, useMarkLeadMutation } = leadsApi;
