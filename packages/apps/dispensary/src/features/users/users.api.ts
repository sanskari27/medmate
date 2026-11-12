import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { StaffDraft, StaffMember } from "./catalog";

export const usersApi = createApi({
  reducerPath: "usersApi",
  baseQuery: apiClient,
  tagTypes: ["Staff"],
  endpoints: (build) => ({
    listStaff: build.query<StaffMember[], void>({
      query: () => ({ url: "/pharmacy/staff" }),
      providesTags: ["Staff"],
    }),
    createStaff: build.mutation<StaffMember, StaffDraft>({
      query: (body) => ({ url: "/pharmacy/staff", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: build.mutation<StaffMember, { id: string; body: Partial<StaffDraft> & { disabled?: boolean } }>({
      query: ({ id, body }) => ({ url: `/pharmacy/staff/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const { useListStaffQuery, useCreateStaffMutation, useUpdateStaffMutation } = usersApi;
