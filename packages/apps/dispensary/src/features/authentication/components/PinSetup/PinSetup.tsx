import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { IconCheck } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useAuthActions } from "../../hooks";
import { pinSetupSchema, type PinSetupFields } from "../../schemas/auth.schema";

export function PinSetupPage() {
  const auth = useAuthActions();
  const form = useForm<PinSetupFields>({
    resolver: zodResolver(pinSetupSchema),
    defaultValues: { pin: "", again: "" },
  });
  const pin = form.watch("pin");
  const again = form.watch("again");
  const againError = form.formState.errors.again?.message;
  const pinError = form.formState.errors.pin?.message;

  async function save() {
    const parsed = pinSetupSchema.safeParse({ pin, again });
    if (!parsed.success) {
      const againIssue = parsed.error.issues.find((issue) => issue.path[0] === "again");
      const pinIssue = parsed.error.issues.find((issue) => issue.path[0] === "pin");
      if (pinIssue) form.setError("pin", { message: pinIssue.message });
      if (againIssue) form.setError("again", { message: againIssue.message });
      return;
    }
    const message = await auth.savePin(parsed.data.pin);
    if (message) form.setError("again", { message });
  }

  return (
    <Stack
      data-slot="pin-setup"
      className="grid h-screen w-full place-items-center overflow-auto bg-canvas p-8 max-[767px]:h-auto max-[767px]:min-h-dvh max-[767px]:px-4 max-[767px]:py-5"
    >
      <Stack className="w-full max-w-[440px]">
        <Heading level={2} className="text-[24px]">
          Create your login PIN
        </Heading>
        <Text className="mt-1.5 mb-[22px] text-[13.5px] text-muted">
          Use this 4-digit PIN next time. A code is only sent for signup or if you forget the PIN.
        </Text>
        <Field label="4-digit PIN" error={pinError} data-field="pin">
          <Input
            className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={pin}
            onChange={(event) => form.setValue("pin", event.target.value.replace(/\D/g, ""))}
            placeholder="••••"
            autoFocus
            aria-invalid={Boolean(pinError)}
          />
        </Field>
        <Field className="mt-3" label="Confirm PIN" error={againError}>
          <Input
            className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={again}
            onChange={(event) => form.setValue("again", event.target.value.replace(/\D/g, ""))}
            onKeyDown={(event) => {
              if (event.key === "Enter") void save();
            }}
            placeholder="••••"
          />
        </Field>
        <Button
          size="lg"
          block
          className="mt-[22px]"
          disabled={pin.length !== 4 || again.length !== 4}
          onClick={() => void save()}
        >
          <IconCheck size={16} /> Save PIN
        </Button>
        <Button
          variant="link"
          className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]"
          onClick={() => void auth.signOut()}
        >
          Log out
        </Button>
      </Stack>
    </Stack>
  );
}
