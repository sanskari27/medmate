import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api/apiClient";
import { authEndpoints, clinicEndpoints } from "@/services/api/apiEndpoints";
import type { ClinicMe, ClinicPatient, Paginated, Session } from "@/types";

export type OtpSendRequest = { phone: string };
export type OtpVerifyRequest = { phone: string; code: string };
export type PinSetRequest = { pin: string };
export type SignOutRequest = { refreshToken?: string };

export type ListPatientsArgs = {
  page?: number;
  size?: number;
  q?: string;
  sort?: string;
  status?: string;
  due?: string;
};

export const api = createApi({
  reducerPath: "api",
  baseQuery: apiClient,
  tagTypes: ["Me", "Patients"],
  endpoints: (build) => ({
    sendOtp: build.mutation<unknown, OtpSendRequest>({
      query: (body) => ({ url: authEndpoints.sendOtp, method: "POST", body }),
    }),
    verifyOtp: build.mutation<Session, OtpVerifyRequest>({
      query: (body) => ({ url: authEndpoints.verifyOtp, method: "POST", body }),
    }),
    setPin: build.mutation<unknown, PinSetRequest>({
      query: (body) => ({ url: authEndpoints.setPin, method: "POST", body }),
    }),
    signOut: build.mutation<unknown, SignOutRequest>({
      query: (body) => ({ url: authEndpoints.signOut, method: "POST", body }),
    }),
    getMe: build.query<ClinicMe, void>({
      query: () => ({ url: clinicEndpoints.me }),
      providesTags: ["Me"],
    }),
    listPatients: build.query<Paginated<ClinicPatient>, ListPatientsArgs | void>({
      query: (args) => ({ url: clinicEndpoints.patients, params: args ?? undefined }),
      providesTags: ["Patients"],
    }),
  }),
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  useSetPinMutation,
  useSignOutMutation,
  useGetMeQuery,
  useListPatientsQuery,
} = api;
