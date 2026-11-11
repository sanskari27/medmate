import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import { authEndpoints } from "@/services/api/apiEndpoints";
import type { Session } from "@/types";
import type {
  OtpSendRequest,
  OtpSendResponse,
  OtpVerifyRequest,
  PinRequest,
  PinSetRequest,
  SignOutRequest,
} from "../types/auth.types";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: apiClient,
  endpoints: (build) => ({
    sendOtp: build.mutation<OtpSendResponse, OtpSendRequest>({
      query: (body) => ({ url: authEndpoints.sendOtp, method: "POST", body }),
    }),
    verifyOtp: build.mutation<Session, OtpVerifyRequest>({
      query: (body) => ({ url: authEndpoints.verifyOtp, method: "POST", body }),
    }),
    pinLogin: build.mutation<Session, PinRequest>({
      query: (body) => ({ url: authEndpoints.pin, method: "POST", body }),
    }),
    setPin: build.mutation<Session["account"], PinSetRequest>({
      query: (body) => ({ url: authEndpoints.setPin, method: "POST", body }),
    }),
    signOut: build.mutation<void, SignOutRequest>({
      query: (body) => ({ url: authEndpoints.signOut, method: "POST", body }),
    }),
  }),
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  usePinLoginMutation,
  useSetPinMutation,
  useSignOutMutation,
} = authApi;
