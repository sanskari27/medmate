import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient, pharmacyEndpoints } from "@/services/api";
import type { ProfileApplication, ProfileSaveResult } from "./model";

export const profileApi = createApi({
  reducerPath: "profileApi",
  baseQuery: apiClient,
  tagTypes: ["Profile"],
  endpoints: (build) => ({
    readProfile: build.query<ProfileApplication, void>({
      query: () => ({ url: pharmacyEndpoints.application }),
      providesTags: ["Profile"],
    }),
    updateProfile: build.mutation<ProfileSaveResult, FormData>({
      query: (body) => ({ url: pharmacyEndpoints.profile, method: "POST", body }),
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const { useReadProfileQuery, useUpdateProfileMutation } = profileApi;
