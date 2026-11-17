import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/app/store/hooks";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/ui/input";
import { verifyOtp } from "@/features/auth";
import { readLatestOtp } from "../../service/auth.service";
import { otpSchema } from "../../schemas/auth.schema";

export type OtpStepProps = {
  phone: string;
};

export function OtpStep({ phone }: OtpStepProps) {
  const dispatch = useAppDispatch();
  const [devCode, setDevCode] = useState<string | null>(null);
  const form = useForm<{ otp: string }>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: "" },
  });
  const otp = form.watch("otp");
  const otpError = form.formState.errors.otp?.message;

  useEffect(() => {
    readLatestOtp(phone).then(setDevCode);
  }, [phone]);

  async function onSubmit(values: { otp: string }) {
    await dispatch(verifyOtp({ phone, code: values.otp, accountType: "clinic" }));
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid w-full max-w-[440px] place-items-center gap-6"
    >
      <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Enter the OTP</h2>
      <p className="mt-1 text-[13.5px] text-muted">
        We sent a 6-digit code to <span className="font-bold">{phone}</span>.
      </p>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="otp" className="text-[13px] text-ink-2">
          6-digit OTP
        </label>
        <Input
          id="otp"
          className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(event) => {
            form.setValue("otp", event.target.value.replace(/\D/g, ""));
          }}
          placeholder="••••••"
          autoFocus
          aria-invalid={Boolean(otpError)}
        />
        {devCode ? (
          <div className="mt-2.5 rounded-sm border border-dashed border-line-2 bg-surface-3 px-3 py-2 text-[12.5px] text-muted">
            Demo OTP:{" "}
            <span className="font-bold text-ink">{devCode}</span>{" "}
            <Button
              variant="ghost"
              className="m-0 inline p-1.5 text-[13px]"
              onClick={() => void form.setValue("otp", devCode ?? "")}
            >
              Auto-fill
            </Button>
          </div>
        ) : null}
        {otpError ? (
          <p className="mt-1 text-[12px] text-red">{otpError}</p>
        ) : null}
      </div>
      <Button
        size="lg"
        type="submit"
        className="mt-[22px] w-full"
        disabled={otp.replace(/\D/g, "").length !== 6}
      >
        <Icon name="check" size={16} /> Verify &amp; log in
      </Button>
      <Button variant="ghost" className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]">
        &larr; Change number
      </Button>
    </form>
  );
}
