import { createAsyncThunk } from "@/store/createAsyncThunk";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { crmService } from "@/services/api/endpoints/crm";
import type { Campaign, Feedback, PatientMeta, ReminderLog } from "@/utils";
import { showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = { auth: { signedIn: boolean } };
type Dispatch = ThunkDispatch<Gate, unknown, Action>;
const reload = (dispatch: Dispatch) => () => dispatch(loadSession()).unwrap();

let reminderSequence = 0;

export const setPatientMeta = createAsyncThunk<
  { key: string; patch: PatientMeta },
  { key: string; patch: PatientMeta },
  { state: Gate; rejectValue: string }
>("crm/setPatientMeta", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the patient",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await crmService.setPatientMeta(body.key, body.patch);
      return body;
    },
  }),
);

export const addCampaign = createAsyncThunk<
  Omit<Campaign, "id" | "sentAt">,
  Omit<Campaign, "id" | "sentAt">,
  { state: Gate; rejectValue: string }
>("crm/addCampaign", async (campaign, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the campaign",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await crmService.addCampaign(campaign);
      dispatch(showToast("Campaign saved"));
      return campaign;
    },
  }),
);

export const addFeedback = createAsyncThunk<
  Omit<Feedback, "id" | "at">,
  Omit<Feedback, "id" | "at">,
  { state: Gate; rejectValue: string }
>("crm/addFeedback", async (feedback, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the feedback",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await crmService.addFeedback(feedback);
      dispatch(showToast("Feedback saved"));
      return feedback;
    },
  }),
);

export const logReminder = createAsyncThunk<
  ReminderLog,
  Omit<ReminderLog, "id" | "at">,
  { state: Gate; rejectValue: string }
>("crm/logReminder", async (reminder, { dispatch, getState, rejectWithValue }) => {
  reminderSequence += 1;
  const saved: ReminderLog = { ...reminder, id: "RM-" + reminderSequence, at: Date.now() };
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not log the reminder",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await crmService.logReminder(reminder);
      return saved;
    },
  });
});

export const redeemPoints = createAsyncThunk<
  { custKey: string; custName: string; points: number },
  { custKey: string; custName: string; points: number },
  { state: Gate; rejectValue: string }
>("crm/redeemPoints", async (body, { dispatch, getState, rejectWithValue }) => {
  if (body.points <= 0) return body;
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not redeem points",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await crmService.redeemPoints(body);
      dispatch(showToast(`Redeemed ${body.points} pts · ₹${body.points} off`));
      return body;
    },
  });
});
