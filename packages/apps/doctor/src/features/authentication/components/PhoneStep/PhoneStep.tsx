import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/app/store/hooks";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/ui/input";
import { sendOtp } from "@/features/auth";
import { phoneSchema } from "../../schemas/auth.schema";
import { DEMO_ACCOUNTS } from "../../service/demoAccounts";

export type PhoneStepProps = {
  onPhone: (phone: string) => void;
};

export function PhoneStep({ onPhone }: PhoneStepProps) {
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const form = useForm<{ phone: string }>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: "" },
  });
  const phone = form.watch("phone");
  const phoneError = form.formState.errors.phone?.message;

  async function onSubmit(values: { phone: string }) {
    setError(null);
    setSending(true);
    try {
      await dispatch(sendOtp({ phone: values.phone, accountType: "clinic" })).unwrap();
      onPhone(values.phone);
    } catch (failure) {
      setError(typeof failure === "string" ? failure : "Could not send a code to that number");
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid w-full max-w-[440px] place-items-center gap-6"
    >
      <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Log in to continue</h2>
      <p className="mt-1 text-[13.5px] text-muted">
        We will send a 6-digit code to your mobile number.
      </p>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="phone" className="text-[13px] text-ink-2">
          Mobile number
        </label>
        <div className="flex items-center gap-2">
          <span className="grid place-items-center rounded-sm border border-line-2 bg-surface-3 px-3.5 font-extrabold text-ink">
            +91
          </span>
          <Input
            id="phone"
            name="phone"
            className="flex-1 min-w-0 text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
            inputMode="numeric"
            maxLength={10}
            value={phone}
            onChange={(event) => {
              form.setValue("phone", event.target.value.replace(/\D/g, ""));
            }}
            placeholder="98860 12345"
            autoFocus
            aria-invalid={Boolean(phoneError)}
          />
        </div>
        {phoneError ? <p className="mt-1 text-[12px] text-red">{phoneError}</p> : null}
      </div>
      {error ? <p className="text-[12.5px] font-bold text-red">{error}</p> : null}
      <Button
        size="lg"
        type="submit"
        className="mt-[22px] w-full"
        disabled={phone.replace(/\D/g, "").length !== 10 || sending}
      >
        <Icon name="chev" size={16} /> {sending ? "Sending…" : "Continue"}
      </Button>
      {import.meta.env.DEV ? <DemoAccounts /> : null}
    </form>
  );
}

/** The seeded accounts, so a local run never gets stuck on an unknown number. */
function DemoAccounts() {
  return (
    <div className="w-full rounded-sm border border-dashed border-line-2 bg-surface-3 px-3 py-2 text-[12.5px] text-muted">
      <p className="mb-1 font-bold text-ink">Demo accounts</p>
      <ul className="grid gap-0.5">
        {DEMO_ACCOUNTS.map((account) => (
          <li key={account.phone}>
            <span className="font-mono font-bold text-ink">{account.phone}</span> · {account.name} ·{" "}
            {account.role}
          </li>
        ))}
      </ul>
      <p className="mt-1">The code is 123456 and the PIN is 1234.</p>
    </div>
  );
}
