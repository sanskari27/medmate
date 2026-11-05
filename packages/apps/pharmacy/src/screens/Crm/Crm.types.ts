import type { Route } from "@/types/common.types";
import type { PharmacyProfile, Sale, SaveFault } from "@/utils";
import type {
  Campaign,
  CrmData,
  Feedback,
  Patient,
  PatientMeta,
  ReminderLog,
} from "@/utils/calculations/crm";

export type CrmTab =
  "overview" | "patients" | "reminders" | "loyalty" | "campaigns" | "feedback" | "analytics";

export type CrmViewProps = {
  patients: Patient[];
  profile: PharmacyProfile;
  now: number;
  sales: Sale[];
  crm: CrmData;
  redeemedBy: Map<string, number>;
  setPatientMeta: (key: string, patch: PatientMeta) => Promise<SaveFault | null>;
  addCampaign: (campaign: Omit<Campaign, "id" | "sentAt">) => Promise<SaveFault | null>;
  addFeedback: (feedback: Omit<Feedback, "id" | "at">) => Promise<SaveFault | null>;
  logReminder: (reminder: Omit<ReminderLog, "id" | "at">) => void;
  redeemPoints: (custKey: string, custName: string, points: number) => void;
  openPatient: (key: string) => void;
  go: (route: Route) => void;
};

export type PatientProfileForm = {
  age: string;
  gender: string;
  bloodGroup: string;
  dob: string;
  address: string;
  conditions: string;
  allergies: string;
  note: string;
  consent: boolean;
};

export const PATIENT_GENDERS = ["Male", "Female", "Other"];
