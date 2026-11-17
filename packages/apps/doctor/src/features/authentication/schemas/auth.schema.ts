import { z } from "zod";

export const loginFieldsSchema = z.object({
  phone: z.string(),
  otp: z.string(),
  pin: z.string(),
});

export type LoginFields = z.infer<typeof loginFieldsSchema>;

const phoneInnerSchema = z.string().regex(/^\d{10}$/, "Enter a 10-digit mobile number");
const otpInnerSchema = z.string().regex(/^\d{4,8}$/, "Enter the code");
const pinInnerSchema = z.string().regex(/^\d{4}$/, "Enter the 4-digit PIN");

export const phoneSchema = z.object({
  phone: phoneInnerSchema,
});

export const otpSchema = z.object({
  otp: otpInnerSchema,
});

export const pinSchema = z.object({
  pin: pinInnerSchema,
});

export const pinSetupSchema = z
  .object({
    pin: pinInnerSchema,
    again: pinInnerSchema,
  })
  .refine((value) => value.pin === value.again, {
    message: "PINs do not match",
    path: ["again"],
  });

export type PinSetupFields = z.infer<typeof pinSetupSchema>;
