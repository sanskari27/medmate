import { createSlice } from "@reduxjs/toolkit";
import { EMPTY_CRM, type CrmData } from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { logReminder, setPatientMeta } from "@/store/thunks/crm.thunk";

export type CrmState = {
  crm: CrmData;
  loading: boolean;
  loaded: boolean;
  error: string | null;
};

const initialState: CrmState = { crm: EMPTY_CRM, loading: false, loaded: false, error: null };

function applyCrm(state: CrmState, session: SessionSnapshot) {
  state.crm = session.crm || state.crm;
}

const crmSlice = createSlice({
  name: "crm",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applyCrm(state, action.payload);
        state.loading = false;
        state.loaded = true;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      .addCase(setPatientMeta.fulfilled, (state, action) => {
        const current = state.crm.meta[action.payload.key];
        state.crm.meta[action.payload.key] = { ...current, ...action.payload.patch };
      })
      .addCase(logReminder.pending, (state, action) => {
        reminderSequence(state, action.meta.arg);
      })
      .addCase(signOutRequest.fulfilled, () => initialState);
  },
});

function reminderSequence(state: CrmState, reminder: { id?: string } & Record<string, unknown>) {
  state.crm.reminders = [
    { ...(reminder as CrmData["reminders"][number]), id: "RM-local", at: Date.now() },
    ...state.crm.reminders,
  ];
}

export default crmSlice.reducer;
