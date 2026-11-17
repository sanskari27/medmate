import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/api/api";
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
  async (arg: OtpSendRequest, { dispatch }) => {
    await dispatch(api.endpoints.sendOtp.initiate(arg)).unwrap();
    dispatch(stepChanged("otp"));
  },
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (arg: OtpVerifyRequest, { dispatch }) => {
    const session = await dispatch(api.endpoints.verifyOtp.initiate(arg)).unwrap();
    dispatch(sessionStarted({ session, pinReset: false }));
    dispatch(stepChanged(session.account?.pinSetupRequired ? "pin-setup" : "pin"));
    return session;
  },
);

export const signInWithPin = createAsyncThunk(
  "auth/signInWithPin",
  async (arg: PinSignInRequest, { dispatch }) => {
    const session = await dispatch(api.endpoints.pin.initiate(arg)).unwrap();
    dispatch(sessionStarted({ session, pinReset: false }));
    return session;
  },
);

export const setPin = createAsyncThunk(
  "auth/setPin",
  async (arg: PinSetRequest, { dispatch, getState }) => {
    await dispatch(api.endpoints.setPin.initiate(arg)).unwrap();
    const state = getState() as RootState;
    const session = state.auth.session;
    if (session) {
      dispatch(sessionStarted({ session, pinReset: false }));
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
    }
  },
);

export { authReducer };
void authReducer;
