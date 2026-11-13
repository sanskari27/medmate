import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type {
  Analytics,
  Campaign,
  Feedback,
  PatientDetail,
  PatientList,
  PatientRow,
  PatientSegment,
  PatientSort,
  Reminder,
} from "./model";

export type PatientQuery = {
  page: number;
  size?: number;
  q?: string;
  sort?: PatientSort;
  segment?: PatientSegment;
};

export const patientsApi = createApi({
  reducerPath: "patientsApi",
  baseQuery: apiClient,
  tagTypes: ["Patients"],
  endpoints: (build) => ({
    listPatients: build.query<PatientList, PatientQuery>({
      query: ({ page, size = 25, q, sort, segment }) => ({
        url: "/pharmacy/patients",
        params: {
          page,
          size,
          ...(q ? { q } : {}),
          ...(sort ? { sort } : {}),
          ...(segment && segment !== "all" ? { segment } : {}),
        },
      }),
      providesTags: ["Patients"],
    }),
    exportPatients: build.query<{ patients: PatientRow[] }, Omit<PatientQuery, "page">>({
      query: ({ q, sort, segment }) => ({
        url: "/pharmacy/patients/export",
        params: {
          ...(q ? { q } : {}),
          ...(sort ? { sort } : {}),
          ...(segment && segment !== "all" ? { segment } : {}),
        },
      }),
    }),
    readPatient: build.query<{ patient: PatientDetail }, string>({
      query: (phone) => ({ url: `/pharmacy/patients/${encodeURIComponent(phone)}` }),
      providesTags: ["Patients"],
    }),
    updatePatient: build.mutation<{ patient: PatientDetail }, { phone: string; body: unknown }>({
      query: ({ phone, body }) => ({
        url: `/pharmacy/patients/${encodeURIComponent(phone)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Patients"],
    }),
    repay: build.mutation<{ repayment: { code: string } }, { phone: string; body: unknown }>({
      query: ({ phone, body }) => ({
        url: `/pharmacy/patients/${encodeURIComponent(phone)}/repayments`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Patients"],
    }),
    remind: build.mutation<
      { reminder: Reminder },
      { phone: string; kind: string; channel: string }
    >({
      query: ({ phone, kind, channel }) => ({
        url: `/pharmacy/patients/${encodeURIComponent(phone)}/reminders`,
        method: "POST",
        body: { kind, channel },
      }),
      invalidatesTags: ["Patients"],
    }),
    redeem: build.mutation<{ redemption: { points: number } }, string>({
      query: (phone) => ({
        url: `/pharmacy/patients/${encodeURIComponent(phone)}/redemptions`,
        method: "POST",
      }),
      invalidatesTags: ["Patients"],
    }),
    saveFeedback: build.mutation<{ feedback: Feedback }, { phone: string; body: unknown }>({
      query: ({ phone, body }) => ({
        url: `/pharmacy/patients/${encodeURIComponent(phone)}/feedback`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Patients"],
    }),
    listCampaigns: build.query<{ campaigns: Campaign[] }, void>({
      query: () => ({ url: "/pharmacy/crm/campaigns" }),
      providesTags: ["Patients"],
    }),
    addCampaign: build.mutation<
      { campaign: Campaign; first: { phone: string; name: string } | null },
      { segment: string; channel: string; message: string; offerLabel?: string }
    >({
      query: (body) => ({ url: "/pharmacy/crm/campaigns", method: "POST", body }),
      invalidatesTags: ["Patients"],
    }),
    listReminders: build.query<{ reminders: Reminder[] }, void>({
      query: () => ({ url: "/pharmacy/crm/reminders" }),
      providesTags: ["Patients"],
    }),
    listFeedback: build.query<{ feedback: Feedback[] }, void>({
      query: () => ({ url: "/pharmacy/crm/feedback" }),
      providesTags: ["Patients"],
    }),
    analytics: build.query<Analytics, void>({
      query: () => ({ url: "/pharmacy/crm/analytics" }),
      providesTags: ["Patients"],
    }),
  }),
});

export const {
  useListPatientsQuery,
  useLazyExportPatientsQuery,
  useReadPatientQuery,
  useUpdatePatientMutation,
  useRepayMutation,
  useRemindMutation,
  useRedeemMutation,
  useSaveFeedbackMutation,
  useListCampaignsQuery,
  useAddCampaignMutation,
  useListRemindersQuery,
  useListFeedbackQuery,
  useAnalyticsQuery,
} = patientsApi;
