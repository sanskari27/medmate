import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { EmployeeList, EmployeeOne, EmployeePayload } from "./model";

export const employeesApi = createApi({
  reducerPath: "employeesApi",
  baseQuery: apiClient,
  tagTypes: ["Employees"],
  endpoints: (build) => ({
    listEmployees: build.query<EmployeeList, void>({
      query: () => ({ url: "/pharmacy/employees" }),
      providesTags: ["Employees"],
    }),
    createEmployee: build.mutation<EmployeeOne, EmployeePayload | FormData>({
      query: (body) => ({ url: "/pharmacy/employees", method: "POST", body }),
      invalidatesTags: ["Employees"],
    }),
    updateEmployee: build.mutation<
      EmployeeOne,
      { code: string; body: EmployeePayload | FormData | { status: "inactive" } }
    >({
      query: ({ code, body }) => ({ url: `/pharmacy/employees/${code}`, method: "PATCH", body }),
      invalidatesTags: ["Employees"],
    }),
  }),
});

export const { useListEmployeesQuery, useCreateEmployeeMutation, useUpdateEmployeeMutation } =
  employeesApi;
