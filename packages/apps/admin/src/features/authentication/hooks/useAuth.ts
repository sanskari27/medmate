import { useDispatch, useSelector } from "react-redux";
import type { OtpPurpose } from "@/types";
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
        const sent = await sendOtp({
          phone,
          accountType: "platform",
          purpose,
        }).unwrap();
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
    async verifyCode(phone: string, code: string, purpose: OtpPurpose) {
      try {
        const next = await verifyOtp({
          phone,
          accountType: "platform",
          purpose,
          code,
        }).unwrap();
        dispatch(sessionStarted({ session: next, pinReset: purpose === "pin_reset" }));
        return null;
      } catch (error) {
        return problemMessage(error, "Could not sign in");
      }
    },
    async signInWithPin(phone: string, pin: string) {
      try {
        const next = await pinLogin({
          phone,
          accountType: "platform",
          pin,
        }).unwrap();
        dispatch(sessionStarted({ session: next, pinReset: false }));
        return null;
      } catch (error) {
        return problemMessage(error, "Could not sign in");
      }
    },
    async savePin(pin: string) {
      try {
        await setPin({ pin }).unwrap();
        dispatch(pinSaved());
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
