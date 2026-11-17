import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/app/store/hooks";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/ui/input";
import { signInWithPin } from "@/features/auth";
import { pinSchema } from "../../schemas/auth.schema";

export type PinStepProps = {
  phone: string;
};

export function PinStep({ phone }: PinStepProps) {
  const dispatch = useAppDispatch();
  const [done, setDone] = useState(false);
  const [fault, setFault] = useState<string | null>(null);
  const form = useForm<{ pin: string }>({
    resolver: zodResolver(pinSchema),
    defaultValues: { pin: "" },
  });
  const pin = form.watch("pin");

  if (done) {
    return (
      <div className="grid h-full w-full place-items-center bg-surface-2 text-ink">
        <div className="text-center">
          <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Home</h2>
          <p className="mt-1 text-[13.5px] text-muted">Welcome to the doctor portal.</p>
        </div>
      </div>
    );
  }

  async function onSubmit(values: { pin: string }) {
    setFault(null);
    try {
      await dispatch(signInWithPin({ phone, pin: values.pin, accountType: "clinic" }));
      setDone(true);
    } catch {
      setFault("Invalid PIN. Try again.");
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid w-full max-w-[440px] place-items-center gap-6"
    >
      <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Enter your PIN</h2>
      <p className="mt-1 text-[13.5px] text-muted">
        Use the 4-digit PIN you created after signup.
      </p>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="pin" className="text-[13px] text-ink-2">
          4-digit PIN
        </label>
        <Input
          id="pin"
          className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
          inputMode="numeric"
          maxLength={4}
          type="password"
          value={pin}
          onChange={(event) => {
            form.setValue("pin", event.target.value.replace(/\D/g, ""));
          }}
          placeholder="••••"
          autoFocus
          aria-invalid={Boolean(fault)}
        />
        {fault ? <p className="mt-1 text-[12px] text-red">{fault}</p> : null}
      </div>
      <Button
        size="lg"
        type="submit"
        className="mt-[22px] w-full"
        disabled={pin.replace(/\D/g, "").length !== 4}
      >
        <Icon name="check" size={16} /> Sign in
      </Button>
    </form>
  );
}
