import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient, pharmacyEndpoints } from "@/services/api";
import type { InvoiceSaveResult, InvoiceSettingsView } from "./model";

export const invoiceSettingsApi = createApi({
  reducerPath: "invoiceSettingsApi",
  baseQuery: apiClient,
  tagTypes: ["InvoiceSettings"],
  endpoints: (build) => ({
    readInvoiceSettings: build.query<InvoiceSettingsView, void>({
      query: () => ({ url: pharmacyEndpoints.invoiceSettings }),
      providesTags: ["InvoiceSettings"],
    }),
    updateInvoiceSettings: build.mutation<InvoiceSaveResult, FormData>({
      query: (body) => ({ url: pharmacyEndpoints.invoiceSettings, method: "POST", body }),
      invalidatesTags: ["InvoiceSettings"],
    }),
  }),
});

export const { useReadInvoiceSettingsQuery, useUpdateInvoiceSettingsMutation } = invoiceSettingsApi;
