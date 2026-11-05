import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Input } from "@/components/atoms/Input";
import { cn } from "@/utils/className";

const otpInputVariants = cva("text-center font-mono text-[22px] font-extrabold tracking-[0.28em]");

export type OtpInputProps = ComponentProps<typeof Input> & {
  length?: number;
};

export function OtpInput({ className, length = 6, ...props }: OtpInputProps) {
  return (
    <Input
      data-slot="otp-input"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={length}
      className={cn(otpInputVariants(), className)}
      {...props}
    />
  );
}

export { otpInputVariants };
