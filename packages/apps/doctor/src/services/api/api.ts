import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api/apiClient";
import { authEndpoints, clinicEndpoints } from "@/services/api/apiEndpoints";
import type { ClinicAccount, ClinicMe, ClinicPatient, Paginated, Session } from "@/types";

export type OtpPurpose = "login" | "pin_reset" | "signup";

export type OtpSendRequest = { phone: string; accountType?: string; purpose?: OtpPurpose };
export type OtpVerifyRequest = {
  phone: string;
  code: string;
  accountType?: string;
  purpose?: OtpPurpose;
};
export type PinSetRequest = { pin: string };
export type PinSignInRequest = { phone: string; pin: string; accountType?: string };
export type SignOutRequest = { refreshToken?: string };

export type OtpSendResponse = {
  /** "otp" when a code was sent, "pin" when the account signs in with its PIN. */
  mode: "otp" | "pin";
};

export type OtpVerifyResponse = Session & {
  account?: ClinicAccount;
};

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
    sendOtp: build.mutation<OtpSendResponse, OtpSendRequest>({
      query: (body) => ({
        url: authEndpoints.sendOtp,
        method: "POST",
        body: { purpose: "login", ...body },
      }),
    }),
    verifyOtp: build.mutation<OtpVerifyResponse, OtpVerifyRequest>({
      query: (body) => ({
        url: authEndpoints.verifyOtp,
        method: "POST",
        body: { purpose: "login", ...body },
      }),
    }),
    pin: build.mutation<OtpVerifyResponse, PinSignInRequest>({
      query: (body) => ({ url: authEndpoints.pin, method: "POST", body }),
    }),
    setPin: build.mutation<ClinicAccount, PinSetRequest>({
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
