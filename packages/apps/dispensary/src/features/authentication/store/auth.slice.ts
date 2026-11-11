import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { AUTH_SESSION_CLEARED, AUTH_SESSION_STARTED } from "@/constants";
import type { Account, Session, VerificationStatus } from "@/types";

export type AuthState = {
  session: Session | null;
  pinReset: boolean;
};

const initialState: AuthState = {
  session: null,
  pinReset: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionStarted(state, action: PayloadAction<{ session: Session; pinReset: boolean }>) {
      state.session = action.payload.session;
      state.pinReset = action.payload.pinReset;
    },
    pinSaved(state, action: PayloadAction<Account>) {
      state.pinReset = false;
      if (state.session) state.session.account = action.payload;
    },
    sessionCleared(state) {
      state.session = null;
      state.pinReset = false;
    },
    applicationSubmitted(
      state,
      action: PayloadAction<{
        status: VerificationStatus;
        rejection: Account["rejection"];
        pinSetupRequired: boolean;
        displayName: string | null;
      }>,
    ) {
      if (!state.session) return;
      state.session.account.verificationStatus = action.payload.status;
      state.session.account.rejection = action.payload.rejection;
      state.session.account.pinSetupRequired = action.payload.pinSetupRequired;
      if (action.payload.displayName)
        state.session.account.displayName = action.payload.displayName;
    },
  },
});

type AuthActionName = "sessionStarted" | "sessionCleared";

function expectAuthAction<Name extends AuthActionName>(name: Name, type: `auth/${Name}`) {
  if (type !== `auth/${name}`) {
    throw new Error(`${type} does not match auth/${name}`);
  }
}

expectAuthAction("sessionStarted", AUTH_SESSION_STARTED);
expectAuthAction("sessionCleared", AUTH_SESSION_CLEARED);

export function selectAuth(state: { auth: AuthState }): AuthState {
  return state.auth;
}

export const { sessionStarted, pinSaved, sessionCleared, applicationSubmitted } = authSlice.actions;
export const authReducer = authSlice.reducer;
