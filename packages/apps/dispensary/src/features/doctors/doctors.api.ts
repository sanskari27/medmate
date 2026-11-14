import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { DoctorList, DoctorOne, DoctorPayload } from "./model";

export const doctorsApi = createApi({
  reducerPath: "doctorsApi",
  baseQuery: apiClient,
  tagTypes: ["Doctors"],
  endpoints: (build) => ({
    listDoctors: build.query<DoctorList, void>({
      query: () => ({ url: "/pharmacy/doctors" }),
      providesTags: ["Doctors"],
    }),
    createDoctor: build.mutation<DoctorOne, DoctorPayload | FormData>({
      query: (body) => ({ url: "/pharmacy/doctors", method: "POST", body }),
      invalidatesTags: ["Doctors"],
    }),
    updateDoctor: build.mutation<DoctorOne, { id: string; body: DoctorPayload | FormData }>({
      query: ({ id, body }) => ({ url: `/pharmacy/doctors/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Doctors"],
    }),
  }),
});

export const { useListDoctorsQuery, useCreateDoctorMutation, useUpdateDoctorMutation } = doctorsApi;
