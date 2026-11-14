import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { DepartmentList, DepartmentOne, DepartmentPayload } from "./model";

export const departmentsApi = createApi({
  reducerPath: "departmentsApi",
  baseQuery: apiClient,
  tagTypes: ["Departments"],
  endpoints: (build) => ({
    listDepartments: build.query<DepartmentList, void>({
      query: () => ({ url: "/pharmacy/departments" }),
      providesTags: ["Departments"],
    }),
    createDepartment: build.mutation<DepartmentOne, DepartmentPayload>({
      query: (body) => ({ url: "/pharmacy/departments", method: "POST", body }),
      invalidatesTags: ["Departments"],
    }),
    updateDepartment: build.mutation<DepartmentOne, { id: string; body: DepartmentPayload }>({
      query: ({ id, body }) => ({ url: `/pharmacy/departments/${id}`, method: "PATCH", body }),
      invalidatesTags: ["Departments"],
    }),
  }),
});

export const { useListDepartmentsQuery, useCreateDepartmentMutation, useUpdateDepartmentMutation } =
  departmentsApi;
