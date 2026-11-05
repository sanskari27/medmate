import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import {
  IconArrowRight,
  IconChart,
  IconCheck,
  IconGlobe,
  IconHospital,
  IconMedical,
  IconReceipt,
  IconReports,
  IconRx,
  IconStore,
} from "@/components/atoms/Icon";
import { Field } from "@/components/molecules/Field";
import { Pill } from "@/components/atoms/Pill";
import { usePharma } from "@/hooks";
import { api } from "@/services/api/apiClient";
import type { BusinessType } from "@/types";
import { cn } from "@/utils/className";
import type { OnboardingCarouselProps } from "./OnboardingCarousel.types";

type Phase = "intro" | "type" | "login";
type Glyph = (props: { size?: number }) => ReactNode;

const SLIDES: { icon: Glyph; title: string; body: string }[] = [
  {
    icon: IconReceipt,
    title: "Billing, GST & inventory in one place",
    body: "Counter & online sales, batch-wise stock, expiry alerts and one-tap GST invoices — built for Indian pharmacies.",
  },
  {
    icon: IconGlobe,
    title: "Sell online & accept orders",
    body: "List your store on the Namma MedMate app, manage prescriptions, offers and a self-order kiosk.",
  },
  {
    icon: IconChart,
    title: "Reports, credit & CRM",
    body: "Daybook, GST returns, customer khata, loyalty and campaigns — share clean reports with your CA.",
  },
];

const TYPES: { key: BusinessType; icon: Glyph; title: string; body: string; bullets: string[] }[] = [
  {
    key: "pharmacy",
    icon: IconStore,
    title: "Retail Pharmacy",
    body: "Standalone medical store / chemist",
    bullets: ["Counter & online billing", "Inventory, purchases & reorder", "Customers, khata & CRM"],
  },
  {
    key: "hospital",
    icon: IconHospital,
    title: "Hospital Pharmacy",
    body: "In-hospital pharmacy & IPD store",
    bullets: ["Everything in Retail, plus:", "IPD wards & ward indents", "Departments & insurance / TPA claims"],
  },
];

function GlyphView({ glyph: Icon, size }: { glyph: Glyph; size: number }) {
  return <Icon size={size} />;
}

function BrandLockup({ light }: { light?: boolean }) {
  return (
    <Stack direction="row" align="center" gap={3}>
      <Box className={cn("grid h-11 w-11 place-items-center rounded-md", light ? "bg-paper text-mid" : "bg-dark text-white")}>
        <IconMedical size={26} />
      </Box>
      <Stack gap={0}>
        <Text as="span" className={cn("font-display text-[16px] font-extrabold", light ? "text-white" : "text-dark")}>
          <Text as="span" className="text-gold">
            Namma
          </Text>{" "}
          MedMate
        </Text>
        <Text as="span" className={cn("text-[10px] font-bold tracking-[0.14em] uppercase", light ? "text-mint" : "text-muted")}>
          Partner Console
        </Text>
      </Stack>
    </Stack>
  );
}

function Aside({ type }: { type: BusinessType }) {
  const hospital = type === "hospital";
  return (
    <Stack className="relative justify-between bg-dark px-8 py-10 text-white lg:w-[44%] lg:max-w-[560px]">
      <BrandLockup light />
      <Stack gap={3} className="my-10">
        <Heading level={1} className="max-w-sm text-white">
          Run your{hospital ? " hospital" : ""} pharmacy from one screen.
        </Heading>
        <Text className="max-w-md text-white/80">
          Billing, inventory, online orders, GST &{" "}
          {hospital ? "IPD wards, indents and insurance claims." : "customer credit — everything in one console."}
        </Text>
      </Stack>
      <Stack gap={3}>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-sm bg-white/10">
            <IconRx size={16} />
          </Box>
          <Text as="span" className="text-white">
            Rx-aware billing
          </Text>
        </Stack>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-sm bg-white/10">
            <IconReports size={16} />
          </Box>
          <Text as="span" className="text-white">
            GST returns & CA-ready
          </Text>
        </Stack>
        <Text variant="caption" className="text-white/50">
          © 2026 Medmate India Technology Private Limited · All rights reserved.
        </Text>
      </Stack>
    </Stack>
  );
}

function SlideDot({ index, active, onPick }: { index: number; active: boolean; onPick: (index: number) => void }) {
  function onClick() {
    onPick(index);
  }
  return (
    <Button
      variant="link"
      aria-label={`Slide ${index + 1}`}
      onClick={onClick}
      className={cn("h-2 w-2 rounded-full p-0", active ? "bg-mid" : "bg-line")}
    />
  );
}

function SlideDots({ active, onPick }: { active: number; onPick: (index: number) => void }) {
  function renderDot(_slide: (typeof SLIDES)[number], index: number) {
    return <SlideDot key={index} index={index} active={index === active} onPick={onPick} />;
  }
  return SLIDES.map(renderDot);
}

function IntroPhase({
  slide,
  onPick,
  onStart,
  onLogin,
  onStaff,
}: {
  slide: number;
  onPick: (index: number) => void;
  onStart: () => void;
  onLogin: () => void;
  onStaff: () => void;
}) {
  const current = SLIDES[slide];
  return (
    <Stack align="center" gap={4} className="text-center">
      <Box className="grid h-16 w-16 place-items-center rounded-lg bg-wash text-mid">
        <GlyphView glyph={current.icon} size={40} />
      </Box>
      <Heading level={2}>{current.title}</Heading>
      <Text variant="muted">{current.body}</Text>
      <Stack direction="row" justify="center" gap={2}>
        <SlideDots active={slide} onPick={onPick} />
      </Stack>
      <Button size="lg" block onClick={onStart}>
        Get started <IconArrowRight size={16} />
      </Button>
      <Button variant="link" onClick={onLogin}>
        I already have an account · Log in
      </Button>
      <Button variant="link" onClick={onStaff}>
        Namma MedMate staff sign in
      </Button>
    </Stack>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <Stack direction="row" align="center" gap={2}>
      <Box className="text-mid">
        <IconCheck size={13} />
      </Box>
      <Text as="span" className="text-[13px]">
        {text}
      </Text>
    </Stack>
  );
}

function Bullets({ items }: { items: string[] }) {
  function renderBullet(item: string) {
    return <Bullet key={item} text={item} />;
  }
  return items.map(renderBullet);
}

function TypeCard({
  item,
  selected,
  onSelect,
}: {
  item: (typeof TYPES)[number];
  selected: boolean;
  onSelect: (key: BusinessType) => void;
}) {
  function onClick() {
    onSelect(item.key);
  }
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-full flex-col items-stretch gap-3 whitespace-normal px-4 py-4 text-left",
        selected && "border-mid bg-wash",
      )}
    >
      <Stack direction="row" align="center" gap={3}>
        <Box className="grid h-10 w-10 place-items-center rounded-sm bg-wash text-mid">
          <GlyphView glyph={item.icon} size={24} />
        </Box>
        <Stack gap={0} className="min-w-0 flex-1">
          <Text as="span" className="font-bold">
            {item.title}
          </Text>
          <Text variant="caption">{item.body}</Text>
        </Stack>
        <Box className={cn("h-4 w-4 rounded-full border-2", selected ? "border-mid bg-mid" : "border-line-2")} />
      </Stack>
      <Stack gap={1}>
        <Bullets items={item.bullets} />
      </Stack>
    </Button>
  );
}

function TypePhase({
  type,
  onType,
  onBack,
  onContinue,
}: {
  type: BusinessType;
  onType: (key: BusinessType) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  function renderType(item: (typeof TYPES)[number]) {
          return <TypeCard key={item.key} item={item} selected={type === item.key} onSelect={onType} />;
        }
  return (
    <Stack gap={4}>
      <Heading level={2}>Choose your business</Heading>
      <Text variant="muted">This choice stays with this mobile number.</Text>
      <Stack gap={3}>
        {TYPES.map(renderType)}
      </Stack>
      <Stack direction="row" justify="between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button size="lg" onClick={onContinue}>
          Continue <IconArrowRight size={16} />
        </Button>
      </Stack>
    </Stack>
  );
}

function LoginPhase({
  staff,
  type,
  onBack,
  onMaster,
}: {
  staff: boolean;
  type: BusinessType;
  onBack: () => void;
  onMaster: () => void;
}) {
  const { signIn, signInWithPin, showFault, formFault } = usePharma();
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pinMode, setPinMode] = useState(false);
  const [resetPin, setResetPin] = useState(false);
  const [otp, setOtp] = useState("");
  const [pin, setPin] = useState("");
  const [name, setName] = useState("");
  const [devOtp, setDevOtp] = useState(false);
  const demoCode = !import.meta.env.PROD ? "123456" : "";
  const otpRef = useRef<HTMLInputElement>(null);
  const chosen = TYPES.find(function match(item) {
    return item.key === type;
  })!;
  const phoneOk = phone.replace(/\D/g, "").length >= 10;

  useEffect(
    function focusOtp() {
      if (otpSent) otpRef.current?.focus();
    },
    [otpSent],
  );

  async function sendOtp(purpose?: "reset") {
    if (!phoneOk) return;
    try {
      const res = await api<{ delivery?: string }>("/auth/otp/send", {
        method: "POST",
        body: { phone, purpose, portal: staff ? "master" : undefined },
      });
      setOtpSent(true);
      setPinMode(false);
      setResetPin(purpose === "reset");
      setDevOtp(res.delivery === "dev");
    } catch (err) {
      showFault(err, "Could not send OTP");
    }
  }
  async function continuePhone() {
    if (!phoneOk) return;
    if (staff) {
      await sendOtp();
      return;
    }
    try {
      const res = await api<{ mode: "pin" | "otp" }>("/auth/login", {
        method: "POST",
        body: { phone },
      });
      if (res.mode === "pin") {
        setPinMode(true);
        setOtpSent(false);
        setPin("");
        return;
      }
      await sendOtp();
    } catch (err) {
      showFault(err, "Could not continue");
    }
  }
  async function verify() {
    if (pinMode && !otpSent) {
      if (pin.length !== 4) return;
      try {
        await signInWithPin(phone, pin);
      } catch (err) {
        showFault(err, "Could not sign in");
      }
      return;
    }
    if (otp.replace(/\D/g, "").length !== 6) return;
    try {
      if (staff) {
        await api("/auth/otp/verify", {
          method: "POST",
          body: { phone, code: otp, portal: "master" },
        });
        onMaster();
        return;
      }
      await signIn(type, name, phone, otp, resetPin ? "reset" : undefined);
    } catch (err) {
      showFault(err, "Could not sign in");
    }
  }
  function onName(event: ChangeEvent<HTMLInputElement>) {
    setName(event.target.value);
  }
  function onPhone(event: ChangeEvent<HTMLInputElement>) {
    setPhone(event.target.value.replace(/\D/g, ""));
  }
  function onPhoneKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void continuePhone();
  }
  function onPin(event: ChangeEvent<HTMLInputElement>) {
    setPin(event.target.value.replace(/\D/g, ""));
  }
  function onPinKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void verify();
  }
  function onOtp(event: ChangeEvent<HTMLInputElement>) {
    setOtp(event.target.value.replace(/\D/g, ""));
  }
  function onOtpKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void verify();
  }
  function onForgot() {
    void sendOtp("reset");
  }
  function onFill() {
    setOtp(demoCode);
  }
  function onChangeNumber() {
    setOtpSent(false);
    setOtp("");
    setPinMode(false);
    setResetPin(false);
  }
  const heading = otpSent ? "Enter the OTP" : pinMode ? "Enter your PIN" : staff ? "Staff sign in" : "Log in to continue";
  const subtitle = otpSent
    ? `We sent a 6-digit code to ${phone}.`
    : pinMode
      ? "Use the 4-digit PIN you created after signup."
      : staff
        ? "Staff sign in uses a one-time code."
        : "New pharmacies get a code by SMS. After that, sign in with your PIN.";

  return (
    <Stack gap={4}>
      <Pill tone={staff ? "gold" : "green"}>
        {staff ? (
          "Master"
        ) : (
          <>
            <GlyphView glyph={chosen.icon} size={15} /> {chosen.title}
          </>
        )}
      </Pill>
      <Heading level={2}>{heading}</Heading>
      <Text variant="muted">{subtitle}</Text>
      {!otpSent && !pinMode ? (
        <Stack gap={3}>
          {staff ? null : (
            <Field label="Business name (optional)">
              <Input
                value={name}
                onChange={onName}
                placeholder={type === "hospital" ? "City Care Hospital Pharmacy" : "Sri Sai Medicals"}
              />
            </Field>
          )}
          <Field label="Mobile number" error={formFault?.field === "phone" ? formFault.message : undefined} data-field="phone">
            <Stack direction="row" align="center" gap={2}>
              <Text as="span" className="font-bold">
                +91
              </Text>
              <Input
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={onPhone}
                onKeyDown={onPhoneKey}
                placeholder="98860 12345"
                autoFocus
                aria-invalid={formFault?.field === "phone"}
              />
            </Stack>
          </Field>
          <Button size="lg" block disabled={!phoneOk} onClick={continuePhone}>
            {staff ? "Send OTP" : "Continue"} <IconArrowRight size={16} />
          </Button>
        </Stack>
      ) : null}
      {pinMode && !otpSent ? (
        <Stack gap={3}>
          <Field label="4-digit PIN" error={formFault?.field === "pin" ? formFault.message : undefined} data-field="pin">
            <Input
              className="font-mono tracking-[0.3em]"
              inputMode="numeric"
              maxLength={4}
              type="password"
              value={pin}
              onChange={onPin}
              onKeyDown={onPinKey}
              placeholder="••••"
              autoFocus
              aria-invalid={formFault?.field === "pin"}
            />
          </Field>
          <Button size="lg" block disabled={pin.length !== 4} onClick={verify}>
            <IconCheck size={16} /> Log in
          </Button>
          <Button variant="link" onClick={onForgot}>
            Forgot PIN
          </Button>
        </Stack>
      ) : null}
      {otpSent ? (
        <Stack gap={3}>
          <Field label="6-digit OTP" error={formFault?.field === "otp" ? formFault.message : undefined} data-field="otp">
            <Input
              ref={otpRef}
              className="font-mono tracking-[0.3em]"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={onOtp}
              onKeyDown={onOtpKey}
              placeholder="••••••"
              aria-invalid={formFault?.field === "otp"}
            />
          </Field>
          {devOtp && demoCode ? (
            <Text variant="caption">
              Demo OTP:{" "}
              <Text as="span" className="font-bold">
                {demoCode}
              </Text>{" "}
              <Button variant="link" onClick={onFill}>
                Auto-fill
              </Button>
            </Text>
          ) : null}
          <Button size="lg" block disabled={otp.replace(/\D/g, "").length !== 6} onClick={verify}>
            <IconCheck size={16} /> {staff ? "Verify & open master" : "Verify & log in"}
          </Button>
          <Button variant="link" onClick={onChangeNumber}>
            ← Change number
          </Button>
        </Stack>
      ) : null}
      <Button variant="link" onClick={onBack}>
        ← Back
      </Button>
      <Text variant="caption" className="text-center">
        By continuing you agree to the Terms of Service & Privacy Policy.
      </Text>
    </Stack>
  );
}

export function OnboardingCarousel({ onMaster, className }: OnboardingCarouselProps) {
  const [staff, setStaff] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [slide, setSlide] = useState(0);
  const [type, setType] = useState<BusinessType>("pharmacy");

  useEffect(
    function advanceSlides() {
      if (phase !== "intro") return;
      const timer = setInterval(function tick() {
        setSlide(function next(current) {
          return (current + 1) % SLIDES.length;
        });
      }, 4000);
      return function stop() {
        clearInterval(timer);
      };
    },
    [phase],
  );

  function pickSlide(index: number) {
    setSlide(index);
  }
  function start() {
    setPhase("type");
    setStaff(false);
  }
  function login() {
    setPhase("login");
    setStaff(false);
  }
  function staffLogin() {
    setPhase("login");
    setStaff(true);
  }
  function backToIntro() {
    setPhase("intro");
  }
  function chooseType(next: BusinessType) {
    setType(next);
  }
  function continueType() {
    setPhase("login");
  }

  return (
    <Stack data-slot="onboarding-carousel" className={cn("min-h-dvh bg-canvas lg:flex-row", className)}>
      <Aside type={type} />
      <Stack align="center" justify="center" className="flex-1 px-4 py-10">
        <Stack className="w-full max-w-md rounded-lg border border-line bg-paper p-6 shadow-card">
          {phase === "intro" ? (
            <IntroPhase slide={slide} onPick={pickSlide} onStart={start} onLogin={login} onStaff={staffLogin} />
          ) : null}
          {phase === "type" ? (
            <TypePhase type={type} onType={chooseType} onBack={backToIntro} onContinue={continueType} />
          ) : null}
          {phase === "login" ? <LoginPhase staff={staff} type={type} onBack={backToIntro} onMaster={onMaster} /> : null}
        </Stack>
      </Stack>
    </Stack>
  );
}

export function PinSetup() {
  const { setLoginPin, signOut, showFault, formFault } = usePharma();
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  function onPin(event: ChangeEvent<HTMLInputElement>) {
    setPin(event.target.value.replace(/\D/g, ""));
  }
  function onAgain(event: ChangeEvent<HTMLInputElement>) {
    setAgain(event.target.value.replace(/\D/g, ""));
  }
  function onAgainKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") void save();
  }
  async function save() {
    if (pin.length !== 4) return;
    if (pin !== again) {
      showFault("PINs do not match");
      return;
    }
    try {
      await setLoginPin(pin, again);
    } catch (err) {
      showFault(err, "Could not save PIN");
    }
  }
  return (
    <Stack data-slot="pin-setup" align="center" justify="center" className="min-h-dvh bg-canvas px-4">
      <Stack gap={4} className="w-full max-w-md rounded-lg border border-line bg-paper p-6 shadow-card">
        <Heading level={2}>Create your login PIN</Heading>
        <Text variant="muted">
          Use this 4-digit PIN next time. A code is only sent for signup or if you forget the PIN.
        </Text>
        <Field label="4-digit PIN" data-field="pin">
          <Input
            className="font-mono tracking-[0.3em]"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={pin}
            onChange={onPin}
            placeholder="••••"
            autoFocus
            aria-invalid={formFault?.field === "pin"}
          />
        </Field>
        <Field label="Confirm PIN" error={formFault?.field === "pin" ? formFault.message : undefined}>
          <Input
            className="font-mono tracking-[0.3em]"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={again}
            onChange={onAgain}
            onKeyDown={onAgainKey}
            placeholder="••••"
          />
        </Field>
        <Button size="lg" block disabled={pin.length !== 4 || again.length !== 4} onClick={save}>
          <IconCheck size={16} /> Save PIN
        </Button>
        <Button variant="link" onClick={signOut}>
          Log out
        </Button>
      </Stack>
    </Stack>
  );
}
