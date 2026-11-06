import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { prescriptionsService } from "@/services/api/endpoints/prescriptions";
import type { Prescription } from "@/utils";
import { pushRoute, showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = { auth: { signedIn: boolean }; prescriptions: { prescriptions: Prescription[] } };
type Dispatch = ThunkDispatch<Gate, unknown, Action>;
const reload = (dispatch: Dispatch) => () => dispatch(loadSession()).unwrap();

export const approvePrescription = createAsyncThunk<
  string,
  string,
  { state: Gate; rejectValue: string }
>("prescriptions/approve", async (id, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not approve the prescription",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await prescriptionsService.approve(id);
      return id;
    },
  }),
);

export const rejectPrescription = createAsyncThunk<
  { id: string; reason?: string },
  { id: string; reason?: string },
  { state: Gate; rejectValue: string }
>("prescriptions/reject", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not reject the prescription",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await prescriptionsService.reject(body.id, body.reason);
      return body;
    },
  }),
);

export const dispensePrescription = createAsyncThunk<
  Prescription,
  string,
  { state: Gate; rejectValue: string }
>("prescriptions/dispense", async (id, { dispatch, getState, rejectWithValue }) => {
  const prescription = getState().prescriptions.prescriptions.find((row) => row.id === id);
  if (!prescription) return rejectWithValue("Prescription not found");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not dispense the prescription",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await prescriptionsService.dispense(id);
      dispatch(pushRoute("pos"));
      dispatch(showToast("Loaded " + prescription.id + " into billing"));
      return prescription;
    },
  });
});
