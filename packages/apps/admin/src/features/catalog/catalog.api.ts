import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { CatalogFilters, CatalogKind, CatalogList, ProductsResponse } from "./model";

export type CatalogQuery = CatalogFilters & { page: number; size: number };

function paramsOf(query: CatalogQuery): Record<string, string | number> {
  const params: Record<string, string | number> = { page: query.page, size: query.size };
  if (query.kind) params.kind = query.kind;
  const q = query.q.trim();
  if (q) params.q = q;
  if (query.displayName) params.displayName = query.displayName;
  if (query.prescription) params.prescription = query.prescription;
  const form = query.form.trim();
  if (form) params.form = form;
  const medicineType = query.medicineType.trim();
  if (medicineType) params.medicineType = medicineType;
  const fmcgType = query.fmcgType.trim();
  if (fmcgType) params.fmcgType = fmcgType;
  const marketer = query.marketer.trim();
  if (marketer) params.marketer = marketer;
  return params;
}

export const catalogApi = createApi({
  reducerPath: "catalogApi",
  baseQuery: apiClient,
  tagTypes: ["Catalog"],
  endpoints: (build) => ({
    listCatalog: build.query<CatalogList, CatalogQuery>({
      query: (query) => ({ url: "/api/v1/catalog", params: paramsOf(query) }),
      providesTags: ["Catalog"],
    }),
    readProduct: build.query<ProductsResponse, string>({
      query: (productId) => ({ url: `/api/products/${encodeURIComponent(productId)}` }),
      providesTags: ["Catalog"],
    }),
    saveProduct: build.mutation<
      ProductsResponse,
      { kind: CatalogKind; productId?: string; body: Record<string, unknown> }
    >({
      query: ({ kind, productId, body }) => ({
        url: productId
          ? `/api/v1/catalog/${kind === "drug" ? "drugs" : "fmcg"}/${encodeURIComponent(productId)}`
          : `/api/v1/catalog/${kind === "drug" ? "drugs" : "fmcg"}`,
        method: productId ? "PUT" : "POST",
        body,
      }),
      invalidatesTags: ["Catalog"],
    }),
  }),
});

export const { useListCatalogQuery, useReadProductQuery, useSaveProductMutation } = catalogApi;
