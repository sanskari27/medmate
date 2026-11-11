import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient, pharmacyEndpoints } from "@/services/api";
import type { PharmacyApplication, VerificationResult } from "./types";

export const setupApi = createApi({
  reducerPath: "setupApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    readApplication: build.query<PharmacyApplication, void>({
      query: () => ({ url: pharmacyEndpoints.application }),
    }),
    submitApplication: build.mutation<VerificationResult, FormData>({
      query: (body) => ({ url: pharmacyEndpoints.application, method: "POST", body }),
    }),
  }),
});

export const { useReadApplicationQuery, useSubmitApplicationMutation } = setupApi;
