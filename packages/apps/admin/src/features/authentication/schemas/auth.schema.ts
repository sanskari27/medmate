import { z } from "@/lib/zod";

export const loginFieldsSchema = z.object({
  phone: z.string(),
  otp: z.string(),
  pin: z.string(),
});

export type LoginFields = z.infer<typeof loginFieldsSchema>;

export const phoneSchema = z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number");

export const otpSchema = z.string().regex(/^\d{6}$/, "Enter the 6-digit OTP");

export const pinSchema = z.string().regex(/^\d{4}$/, "Enter the 4-digit PIN");

export const pinSetupSchema = z
  .object({
    pin: pinSchema,
    again: pinSchema,
  })
  .refine((value) => value.pin === value.again, {
    message: "PINs do not match",
    path: ["again"],
  });

export type PinSetupFields = z.infer<typeof pinSetupSchema>;
