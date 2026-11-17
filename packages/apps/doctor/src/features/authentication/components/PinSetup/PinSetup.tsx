import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useAppDispatch } from "@/app/store/hooks";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/Icon";
import { Input } from "@/components/ui/input";
import { setPin } from "@/features/auth";
import { pinSetupSchema, type PinSetupFields } from "../../schemas/auth.schema";

export function PinSetup() {
  const dispatch = useAppDispatch();
  const [done, setDone] = useState(false);
  const form = useForm<PinSetupFields>({
    resolver: zodResolver(pinSetupSchema),
    defaultValues: { pin: "", again: "" },
  });
  const pin = form.watch("pin");
  const again = form.watch("again");
  const againError = form.formState.errors.again?.message;
  const pinError = form.formState.errors.pin?.message;

  if (done) {
    return (
      <div className="grid h-full w-full place-items-center bg-surface-2 text-ink">
        <div className="text-center">
          <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Home</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            Your PIN is set. Welcome to the doctor portal.
          </p>
        </div>
      </div>
    );
  }

  async function onSubmit(values: PinSetupFields) {
    try {
      await dispatch(setPin({ pin: values.pin }));
      setDone(true);
    } catch {
      // Could not set PIN. Try again.
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid w-full max-w-[440px] place-items-center gap-6"
    >
      <h2 className="text-[22px] font-bold text-ink tracking-[-0.02em]">Create your login PIN</h2>
      <p className="mt-1 text-[13.5px] text-muted">Use this 4-digit PIN next time you sign in.</p>
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
          aria-invalid={Boolean(pinError)}
        />
        {pinError ? <p className="mt-1 text-[12px] text-red">{pinError}</p> : null}
      </div>
      <div className="w-full flex flex-col gap-2">
        <label htmlFor="again" className="text-[13px] text-ink-2">
          Confirm PIN
        </label>
        <Input
          id="again"
          className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
          inputMode="numeric"
          maxLength={4}
          type="password"
          value={again}
          onChange={(event) => {
            form.setValue("again", event.target.value.replace(/\D/g, ""));
          }}
          placeholder="••••"
          aria-invalid={Boolean(againError)}
        />
        {againError ? <p className="mt-1 text-[12px] text-red">{againError}</p> : null}
      </div>
      <Button
        size="lg"
        type="submit"
        className="mt-[22px] w-full"
        disabled={pin.length !== 4 || again.length !== 4}
      >
        <Icon name="check" size={16} /> Save PIN
      </Button>
    </form>
  );
}
