import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/api/api";
import { problemMessage } from "@/services/api";
import { authReducer } from "./authSlice";
import { sessionStarted, sessionCleared, stepChanged } from "./authSlice";
import type {
  OtpSendRequest,
  OtpVerifyRequest,
  PinSetRequest,
  PinSignInRequest,
  SignOutRequest,
} from "@/services/api/api";
import type { RootState } from "@/app/store";

export const sendOtp = createAsyncThunk(
  "auth/sendOtp",
  async (arg: OtpSendRequest, { dispatch, rejectWithValue }) => {
    try {
      const sent = await dispatch(api.endpoints.sendOtp.initiate(arg)).unwrap();
      // An account that already has a PIN signs in with that PIN, and no code
      // is sent to it.
      dispatch(stepChanged(sent.mode === "pin" ? "pin" : "otp"));
    } catch (failure) {
      return rejectWithValue(problemMessage(failure, "Could not send a code to that number"));
    }
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (arg: OtpVerifyRequest, { dispatch, rejectWithValue }) => {
    try {
      const session = await dispatch(api.endpoints.verifyOtp.initiate(arg)).unwrap();
      dispatch(sessionStarted({ session, pinReset: false }));
      dispatch(stepChanged(session.account?.pinSetupRequired ? "pin-setup" : "pin"));
      return session;
    } catch (failure) {
      return rejectWithValue(problemMessage(failure, "That code was not accepted"));
    }
  },
);

export const signInWithPin = createAsyncThunk(
  "auth/signInWithPin",
  async (arg: PinSignInRequest, { dispatch, rejectWithValue }) => {
    try {
      const session = await dispatch(api.endpoints.pin.initiate(arg)).unwrap();
      dispatch(sessionStarted({ session, pinReset: false }));
      return session;
    } catch (failure) {
      return rejectWithValue(problemMessage(failure, "Invalid PIN. Try again."));
    }
  },
);

export const setPin = createAsyncThunk(
  "auth/setPin",
  async (arg: PinSetRequest, { dispatch, getState, rejectWithValue }) => {
    try {
      const account = await dispatch(api.endpoints.setPin.initiate(arg)).unwrap();
      const state = getState() as RootState;
      const session = state.auth.session;
      if (session) {
        // The account the service returns says the PIN is set now, so the
        // portal stops asking for it.
        dispatch(sessionStarted({ session: { ...session, account }, pinReset: false }));
        dispatch(stepChanged("pin"));
      }
    } catch (failure) {
      return rejectWithValue(problemMessage(failure, "Could not set the PIN. Try again."));
    }
  },
);

export const signOut = createAsyncThunk(
  "auth/signOut",
  async (arg: SignOutRequest | void, { dispatch, getState }) => {
    const state = getState() as RootState;
    const body: SignOutRequest = arg ?? { refreshToken: state.auth.session?.refreshToken };
    try {
      await dispatch(api.endpoints.signOut.initiate(body)).unwrap();
    } finally {
      dispatch(sessionCleared());
      // The cached answers belong to the session that is ending. Without
      // this, the next account to sign in would read the clinic and the
      // grants of the one that signed out.
      dispatch(api.util.resetApiState());
    }
  },
);

export { authReducer };
void authReducer;
