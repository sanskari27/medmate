import { latestOtpCode, type SmsMessage } from "../utils/otpMessage";

export async function readLatestOtp(phone: string): Promise<string | null> {
  if (!import.meta.env.DEV) return null;
  try {
    const response = await fetch("/sms-mock/messages");
    if (!response.ok) return null;
    const messages: unknown = await response.json();
    if (!Array.isArray(messages)) return null;
    return latestOtpCode(messages as SmsMessage[], phone);
  } catch {
    return null;
  }
}
