import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { AdmissionList, AdmissionOne, PayMode, WardList, WardOne, WardPayload } from "./model";

export const wardsApi = createApi({
  reducerPath: "wardsApi",
  baseQuery: apiClient,
  tagTypes: ["Wards", "Admissions"],
  endpoints: (build) => ({
    listWards: build.query<WardList, void>({
      query: () => ({ url: "/pharmacy/wards" }),
      providesTags: ["Wards"],
    }),
    createWard: build.mutation<WardOne, WardPayload>({
      query: (body) => ({ url: "/pharmacy/wards", method: "POST", body }),
      invalidatesTags: ["Wards"],
    }),
    updateWard: build.mutation<WardOne, { id: string; body: Partial<WardPayload> }>({
      query: ({ id, body }) => ({ url: `/pharmacy/wards/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Wards", "Admissions"],
    }),
    listAdmissions: build.query<AdmissionList, void>({
      query: () => ({ url: "/pharmacy/admissions" }),
      providesTags: ["Admissions"],
    }),
    admitPatient: build.mutation<
      AdmissionOne,
      {
        name: string;
        uhid: string;
        phone: string | null;
        age: number | null;
        gender: "Male" | "Female" | "Other";
        wardId: string;
        bed: string;
        doctor: string | null;
        diagnosis: string | null;
        payerType: "self" | "insurance";
        insurer: string | null;
        policyNo: string | null;
      }
    >({
      query: (body) => ({ url: "/pharmacy/admissions", method: "POST", body }),
      invalidatesTags: ["Admissions"],
    }),
    transferPatient: build.mutation<AdmissionOne, { id: string; wardId: string; bed: string }>({
      query: ({ id, wardId, bed }) => ({
        url: `/pharmacy/admissions/${id}/transfer`,
        method: "POST",
        body: { wardId, bed },
      }),
      invalidatesTags: ["Admissions"],
    }),
    dischargePatient: build.mutation<AdmissionOne, { id: string; payMode: PayMode | null }>({
      query: ({ id, payMode }) => ({
        url: `/pharmacy/admissions/${id}/discharge`,
        method: "POST",
        body: payMode ? { payMode } : {},
      }),
      invalidatesTags: ["Admissions"],
    }),
  }),
});

export const {
  useListWardsQuery,
  useListAdmissionsQuery,
  useCreateWardMutation,
  useUpdateWardMutation,
  useAdmitPatientMutation,
  useTransferPatientMutation,
  useDischargePatientMutation,
} = wardsApi;
