import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type {
  LineBody,
  PrepCreatedResponse,
  PrepListResponse,
  PrepOneResponse,
  SearchResponse,
} from "./model";

export const prepApi = createApi({
  reducerPath: "prepApi",
  baseQuery: apiClient,
  tagTypes: ["Prep"],
  endpoints: (build) => ({
    listPreps: build.query<PrepListResponse, void>({
      query: () => ({ url: "/api/v1/inventory-prep" }),
      providesTags: ["Prep"],
    }),
    readPrep: build.query<PrepOneResponse, string>({
      query: (id) => ({ url: `/api/v1/inventory-prep/${id}` }),
      providesTags: ["Prep"],
    }),
    createPrep: build.mutation<PrepCreatedResponse, { name: string }>({
      query: (body) => ({ url: "/api/v1/inventory-prep", method: "POST", body }),
      invalidatesTags: ["Prep"],
    }),
    renamePrep: build.mutation<PrepCreatedResponse, { id: string; name: string }>({
      query: ({ id, name }) => ({
        url: `/api/v1/inventory-prep/${id}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: ["Prep"],
    }),
    saveLines: build.mutation<PrepOneResponse, { id: string; lines: LineBody[] }>({
      query: ({ id, lines }) => ({
        url: `/api/v1/inventory-prep/${id}/lines`,
        method: "PUT",
        body: { lines },
      }),
      invalidatesTags: ["Prep"],
    }),
    deletePrep: build.mutation<void, string>({
      query: (id) => ({ url: `/api/v1/inventory-prep/${id}`, method: "DELETE" }),
      invalidatesTags: ["Prep"],
    }),
    exportPrep: build.mutation<string, string>({
      query: (id) => ({
        url: `/api/v1/inventory-prep/${id}/export`,
        method: "POST",
        responseHandler: async (response) => {
          const text = await response.text();
          const type = response.headers.get("content-type") ?? "";
          if (type.includes("text/csv")) return text;
          if (!text) return null;
          try {
            return JSON.parse(text) as unknown;
          } catch {
            return text;
          }
        },
      }),
    }),
    searchCatalog: build.query<SearchResponse, string>({
      query: (q) => ({ url: "/api/search", params: { q, limit: 20 } }),
    }),
  }),
});

export const {
  useListPrepsQuery,
  useReadPrepQuery,
  useCreatePrepMutation,
  useRenamePrepMutation,
  useSaveLinesMutation,
  useDeletePrepMutation,
  useExportPrepMutation,
  useSearchCatalogQuery,
} = prepApi;
