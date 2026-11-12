import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { IconArrowRight, IconCheck } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { PharmacyPortalRole } from "@/types";
import { RoleTabs } from "../RoleTabs";
import { useAuthActions } from "../../hooks";
import {
  loginFieldsSchema,
  otpSchema,
  phoneSchema,
  pinSchema,
  type LoginFields,
} from "../../schemas/auth.schema";
import type { FieldFault } from "../../types/auth.types";

export function LoginPhase({
  mode,
  role,
  onRole,
  onBack,
}: {
  mode: "login" | "signup";
  role: PharmacyPortalRole;
  onRole: (role: PharmacyPortalRole) => void;
  onBack: () => void;
}) {
  const auth = useAuthActions();
  const otpRef = useRef<HTMLInputElement>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [resetPin, setResetPin] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [fault, setFault] = useState<FieldFault | null>(null);
  const form = useForm<LoginFields>({
    resolver: zodResolver(loginFieldsSchema),
    defaultValues: { phone: "", otp: "", pin: "" },
  });
  const phone = form.watch("phone");
  const otp = form.watch("otp");
  const pin = form.watch("pin");
  const phoneOk = phone.replace(/\D/g, "").length >= 10;
  const expectedRole = mode === "signup" ? "owner" : role;

  useEffect(
    function focusOtp() {
      if (otpSent) otpRef.current?.focus();
    },
    [otpSent],
  );

  function selectRole(next: PharmacyPortalRole) {
    onRole(next);
    setOtpSent(false);
    setPinMode(false);
    setResetPin(false);
    setDevCode(null);
    setFault(null);
    form.setValue("otp", "");
    form.setValue("pin", "");
  }

  async function sendCode(purpose: "login" | "pin_reset" | "signup") {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      setFault({
        field: "phone",
        message: parsed.error.issues[0]?.message ?? "Enter a 10-digit mobile number",
      });
      return;
    }
    setFault(null);
    const result = await auth.sendCode(parsed.data, purpose);
    if (result.error || !result.mode) {
      setFault({
        field: purpose === "pin_reset" ? "otp" : "phone",
        message: result.error ?? "Could not send OTP",
      });
      return;
    }
    if (result.mode === "pin") {
      if (purpose === "signup") {
        setFault({
          field: "phone",
          message: "This number is a pharmacy owner. Choose Pharmacy owner to sign in.",
        });
        return;
      }
      setPinMode(true);
      setOtpSent(false);
      setDevCode(null);
      form.setValue("pin", "");
      return;
    }
    setOtpSent(true);
    setPinMode(false);
    setResetPin(purpose === "pin_reset");
    setDevCode(result.devCode);
    form.setValue("otp", "");
  }

  async function continuePhone() {
    if (!phoneOk) return;
    await sendCode(mode === "signup" ? "signup" : "login");
  }

  async function verify() {
    if (pinMode && !otpSent) {
      const parsed = pinSchema.safeParse(pin);
      if (!parsed.success) return;
      const message = await auth.signInWithPin(phone, parsed.data, expectedRole);
      if (message) setFault({ field: "pin", message });
      return;
    }
    const parsed = otpSchema.safeParse(otp);
    if (!parsed.success) return;
    const purpose = resetPin ? "pin_reset" : mode === "signup" ? "signup" : "login";
    const message = await auth.verifyCode(phone, parsed.data, purpose, expectedRole);
    if (message) setFault({ field: "otp", message });
  }

  function onFill() {
    if (!devCode) return;
    form.setValue("otp", devCode);
  }

  function onChangeNumber() {
    setOtpSent(false);
    setDevCode(null);
    setPinMode(false);
    setResetPin(false);
    form.setValue("otp", "");
  }

  const heading = otpSent
    ? "Enter the OTP"
    : pinMode
      ? "Enter your PIN"
      : mode === "signup"
        ? "Create your pharmacy"
        : "Log in to continue";
  const subtitle = otpSent
    ? `We sent a 6-digit code to ${phone}.`
    : pinMode
      ? "Use the 4-digit PIN you created after signup."
      : "Your pharmacy, on one screen.";

  return (
    <Stack className="animate-[pd-ob-in_0.25s_ease] motion-reduce:animate-none">
      <Heading level={2} className="text-[24px]">
        {heading}
      </Heading>
      <Text className="mt-1.5 mb-[22px] text-[13.5px] text-muted">{subtitle}</Text>
      {!otpSent && !pinMode && mode === "login" ? (
        <RoleTabs value={role} onChange={selectRole} className="mb-5" />
      ) : null}
      {!otpSent && !pinMode ? (
        <Stack className="gap-0">
          <Field
            label="Mobile number"
            error={fault?.field === "phone" ? fault.message : undefined}
            data-field="phone"
          >
            <Stack direction="row" align="stretch" className="gap-2">
              <Text
                as="span"
                className="grid place-items-center rounded-sm border border-line-2 bg-wash px-3.5 font-extrabold text-dark"
              >
                +91
              </Text>
              <Input
                className="min-w-0 flex-1"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(event) => {
                  form.setValue("phone", event.target.value.replace(/\D/g, ""));
                  setFault(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void continuePhone();
                }}
                placeholder="98860 12345"
                autoFocus
                aria-invalid={fault?.field === "phone"}
              />
            </Stack>
          </Field>
          <Button
            size="lg"
            block
            className="mt-[22px]"
            disabled={!phoneOk}
            onClick={() => void continuePhone()}
          >
            Continue <IconArrowRight size={16} />
          </Button>
        </Stack>
      ) : null}
      {pinMode && !otpSent ? (
        <Stack className="gap-0">
          <Field
            label="4-digit PIN"
            error={fault?.field === "pin" ? fault.message : undefined}
            data-field="pin"
          >
            <Input
              className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
              inputMode="numeric"
              maxLength={4}
              type="password"
              value={pin}
              onChange={(event) => form.setValue("pin", event.target.value.replace(/\D/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") void verify();
              }}
              placeholder="••••"
              autoFocus
              aria-invalid={fault?.field === "pin"}
            />
          </Field>
          <Button
            size="lg"
            block
            className="mt-[22px]"
            disabled={pin.length !== 4}
            onClick={() => void verify()}
          >
            <IconCheck size={16} /> Log in
          </Button>
          <Button
            variant="link"
            className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]"
            onClick={() => void sendCode("pin_reset")}
          >
            Forgot PIN
          </Button>
        </Stack>
      ) : null}
      {otpSent ? (
        <Stack className="gap-0">
          <Field
            label="6-digit OTP"
            error={fault?.field === "otp" ? fault.message : undefined}
            data-field="otp"
          >
            <Input
              ref={otpRef}
              className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => form.setValue("otp", event.target.value.replace(/\D/g, ""))}
              onKeyDown={(event) => {
                if (event.key === "Enter") void verify();
              }}
              placeholder="••••••"
              aria-invalid={fault?.field === "otp"}
            />
          </Field>
          {devCode ? (
            <Text className="mt-2.5 rounded-sm border border-dashed border-line-2 bg-wash-2 px-3 py-2 text-[12.5px] text-muted">
              Demo OTP:{" "}
              <Text as="span" className="font-bold">
                {devCode}
              </Text>{" "}
              <Button variant="link" className="m-0 inline p-1.5 text-[13px]" onClick={onFill}>
                Auto-fill
              </Button>
            </Text>
          ) : null}
          <Button
            size="lg"
            block
            className="mt-[22px]"
            disabled={otp.replace(/\D/g, "").length !== 6}
            onClick={() => void verify()}
          >
            <IconCheck size={16} /> {mode === "signup" ? "Verify & continue" : "Verify & log in"}
          </Button>
          <Button
            variant="link"
            className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]"
            onClick={onChangeNumber}
          >
            ← Change number
          </Button>
        </Stack>
      ) : null}
      <Stack direction="row" justify="center" className="mt-[18px]">
        <Button
          variant="link"
          className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]"
          onClick={onBack}
        >
          ← Back
        </Button>
      </Stack>
      <Text className="mt-4 text-center text-[11px] text-faint">
        By continuing you agree to the Terms of Service & Privacy Policy.
      </Text>
    </Stack>
  );
}
