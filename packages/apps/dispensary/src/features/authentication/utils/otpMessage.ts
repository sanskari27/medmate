export type SmsMessage = {
  phone?: string;
  code?: string;
};

/** Match the phone the Bruno Send OTP script compares against the SMS mock. */
export function mockPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return raw;
}

export function latestOtpCode(messages: SmsMessage[], rawPhone: string): string | null {
  const target = mockPhone(rawPhone);
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.phone === target && message.code) return message.code;
  }
  return null;
}
