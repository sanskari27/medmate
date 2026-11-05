import type { CrmViewProps } from "../Crm.types";
import { EMPTY_CRM } from "@/utils/calculations/crm";

export const emptyCrmView = {
  patients: [],
  profile: { name: "Sri Sai Medicals" },
  now: 0,
  sales: [],
  crm: EMPTY_CRM,
  redeemedBy: new Map(),
  setPatientMeta: async function save() {
    return null;
  },
  addCampaign: async function add() {
    return null;
  },
  addFeedback: async function add() {
    return null;
  },
  logReminder: function log() {},
  redeemPoints: function redeem() {},
  openPatient: function open() {},
  go: function go() {},
} as unknown as CrmViewProps;
