import { useDispatch, useSelector } from "react-redux";
import { ACCOUNT_TYPE } from "@/constants";
import type { OtpPurpose, PharmacyPortalRole } from "@/types";
import { roleMismatch } from "../utils/accountRole";
import { readLatestOtp } from "../services/auth.service";
import { problemMessage } from "../services/problemMessage";
import {
  usePinLoginMutation,
  useSendOtpMutation,
  useSetPinMutation,
  useSignOutMutation,
  useVerifyOtpMutation,
} from "../services/auth.api";
import { pinSaved, selectAuth, sessionCleared, sessionStarted, type AuthState } from "../store";

export function useAuthState(): AuthState {
  return useSelector(selectAuth);
}

export function useAuthActions() {
  const dispatch = useDispatch();
  const session = useAuthState().session;
  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();
  const [pinLogin] = usePinLoginMutation();
  const [setPin] = useSetPinMutation();
  const [signOutRequest] = useSignOutMutation();

  return {
    async sendCode(phone: string, purpose: OtpPurpose) {
      try {
        const sent = await sendOtp({ phone, accountType: ACCOUNT_TYPE, purpose }).unwrap();
        const devCode = sent.mode === "otp" ? await readLatestOtp(phone) : null;
        return { mode: sent.mode, devCode, error: null };
      } catch (error) {
        return {
          mode: null,
          devCode: null,
          error: problemMessage(error, "Could not send OTP"),
        };
      }
    },
    async verifyCode(
      phone: string,
      code: string,
      purpose: OtpPurpose,
      expectedRole: PharmacyPortalRole,
    ) {
      try {
        const next = await verifyOtp({
          phone,
          accountType: ACCOUNT_TYPE,
          purpose,
          code,
        }).unwrap();
        const mismatch = roleMismatch(next.account, expectedRole);
        if (mismatch) {
          try {
            await signOutRequest({ refreshToken: next.refreshToken }).unwrap();
          } catch {
            // The local session is not stored when the role does not match.
          }
          return mismatch;
        }
        dispatch(sessionStarted({ session: next, pinReset: purpose === "pin_reset" }));
        return null;
      } catch (error) {
        return problemMessage(error, "Could not sign in");
      }
    },
    async signInWithPin(phone: string, pin: string, expectedRole: PharmacyPortalRole) {
      try {
        const next = await pinLogin({ phone, accountType: ACCOUNT_TYPE, pin }).unwrap();
        const mismatch = roleMismatch(next.account, expectedRole);
        if (mismatch) {
          try {
            await signOutRequest({ refreshToken: next.refreshToken }).unwrap();
          } catch {
            // The local session is not stored when the role does not match.
          }
          return mismatch;
        }
        dispatch(sessionStarted({ session: next, pinReset: false }));
        return null;
      } catch (error) {
        return problemMessage(error, "Could not sign in");
      }
    },
    async savePin(pin: string) {
      try {
        const account = await setPin({ pin }).unwrap();
        dispatch(pinSaved(account));
        return null;
      } catch (error) {
        return problemMessage(error, "Could not save PIN");
      }
    },
    async signOut() {
      const refreshToken = session?.refreshToken;
      if (refreshToken) {
        try {
          await signOutRequest({ refreshToken }).unwrap();
        } catch {
          // A failed revoke still ends the local session.
        }
      }
      dispatch(sessionCleared());
    },
  };
}
