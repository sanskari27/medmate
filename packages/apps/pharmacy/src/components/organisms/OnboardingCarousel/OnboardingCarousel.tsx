import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
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
  IconReceipt,
  IconReports,
  IconRx,
  IconStore,
} from "@/components/atoms/Icon";
import { Field } from "@/components/molecules/Field";
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

const TYPES: { key: BusinessType; icon: Glyph; title: string; body: string; bullets: string[] }[] =
  [
    {
      key: "pharmacy",
      icon: IconStore,
      title: "Retail Pharmacy",
      body: "Standalone medical store / chemist",
      bullets: [
        "Counter & online billing",
        "Inventory, purchases & reorder",
        "Customers, khata & CRM",
      ],
    },
    {
      key: "hospital",
      icon: IconHospital,
      title: "Hospital Pharmacy",
      body: "In-hospital pharmacy & IPD store",
      bullets: [
        "Everything in Retail, plus:",
        "IPD wards & ward indents",
        "Departments & insurance / TPA claims",
      ],
    },
  ];

function GlyphView({ glyph: Icon, size }: { glyph: Glyph; size: number }) {
  return <Icon size={size} />;
}

function BrandLockup() {
  const gradientId = useId().replace(/:/g, "");
  return (
    <Stack direction="row" align="center" gap={3} className="relative z-[1]">
      <Box className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-white shadow-[0_8px_22px_#0000004d]">
        <svg width={30} height={30} viewBox="0 0 40 40" fill="none" aria-hidden>
          <defs>
            <linearGradient
              id={gradientId}
              x1="6"
              y1="4"
              x2="34"
              y2="36"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#4A9E6E" />
              <stop offset="1" stopColor="#1B3D29" />
            </linearGradient>
          </defs>
          <path
            d="M20 3.5C12.5 3.5 6.5 9.3 6.5 17c0 8.6 10.7 17.3 12.7 18.8a1.4 1.4 0 0 0 1.6 0C22.8 34.3 33.5 25.6 33.5 17 33.5 9.3 27.5 3.5 20 3.5Z"
            fill={`url(#${gradientId})`}
          />
          <circle cx="20" cy="16.5" r="8.7" fill="#fff" />
          <path d="M18 10.5h4V14h3.5v4H22v3.5h-4V18h-3.5v-4H18z" fill="#2F7D52" />
          <circle cx="27" cy="9" r="3" fill="#D9A648" stroke="#fff" strokeWidth="1.4" />
        </svg>
      </Box>
      <Stack gap={0}>
        <Text as="span" className="block font-display text-[17px] font-extrabold text-white">
          <Text as="span" className="text-gold not-italic">
            Namma
          </Text>{" "}
          MedMate
        </Text>
        <Text as="span" className="text-[9px] font-bold tracking-[0.16em] text-mint uppercase">
          Partner Console
        </Text>
      </Stack>
    </Stack>
  );
}

function TrustRow({ icon: Icon, label }: { icon: Glyph; label: string }) {
  return (
    <Stack
      direction="row"
      align="center"
      className="gap-2.5 text-[13.5px] font-semibold text-[#ffffffeb]"
    >
      <Box className="grid h-7 w-7 place-items-center rounded-sm bg-[#ffffff1f] text-mint">
        <Icon size={16} />
      </Box>
      <Text as="span" className="text-[13.5px] font-semibold text-[#ffffffeb]">
        {label}
      </Text>
    </Stack>
  );
}

function Aside({ type }: { type: BusinessType }) {
  const hospital = type === "hospital";
  return (
    <Stack className="relative hidden w-[44%] max-w-[560px] shrink-0 flex-col overflow-hidden bg-[linear-gradient(160deg,#1b3d29,#0c2516_70%)] px-11 py-10 text-white min-[861px]:flex">
      <Box
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(143,212,168,0.18),transparent_45%),radial-gradient(circle_at_10%_90%,rgba(217,166,72,0.12),transparent_40%)]"
      />
      <BrandLockup />
      <Stack className="relative z-[1] mt-auto">
        <Heading
          level={1}
          className="text-[34px] [line-height:1.12]! tracking-[-0.02em] text-white"
        >
          Run your{hospital ? " hospital" : ""} pharmacy
          <br />
          from one screen.
        </Heading>
        <Text className="mt-3.5 max-w-[420px] text-[15px] leading-normal text-white/80">
          Billing, inventory, online orders, GST &{" "}
          {hospital
            ? "IPD wards, indents and insurance claims."
            : "customer credit — everything in one console."}
        </Text>
      </Stack>
      <Stack className="relative z-[1] mt-7 gap-2.5">
        <TrustRow icon={IconRx} label="Rx-aware billing" />
        <TrustRow icon={IconReports} label="GST returns & CA-ready" />
      </Stack>
      <Text className="relative z-[1] mt-7 text-[11px] leading-normal text-[#ffffff73]">
        © 2026 Medmate India Technology Private Limited · All rights reserved.
      </Text>
    </Stack>
  );
}

function SlideDot({
  index,
  active,
  onPick,
}: {
  index: number;
  active: boolean;
  onPick: (index: number) => void;
}) {
  function onClick() {
    onPick(index);
  }
  return (
    <Button
      variant="link"
      aria-label={`Slide ${index + 1}`}
      onClick={onClick}
      className={cn(
        "h-2 rounded-full p-0 transition-[width,background-color] duration-200",
        active ? "w-[22px] bg-mid" : "w-2 bg-line-2",
      )}
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
    <Stack align="center" className="text-center">
      <Stack
        align="center"
        justify="center"
        className="min-h-[230px] w-full animate-[pd-ob-in_0.4s_ease] motion-reduce:animate-none"
      >
        <Box className="inline-grid place-items-center">
          <GlyphView glyph={current.icon} size={40} />
        </Box>
        <Heading level={2} className="mt-[18px] max-w-[360px] text-[23px]">
          {current.title}
        </Heading>
        <Text variant="muted" className="mt-3 max-w-[380px] text-[14px] leading-normal">
          {current.body}
        </Text>
      </Stack>
      <Stack direction="row" justify="center" className="mt-5 gap-2">
        <SlideDots active={slide} onPick={onPick} />
      </Stack>
      <Button size="lg" block className="mt-[22px]" onClick={onStart}>
        Get started <IconArrowRight size={16} />
      </Button>
      <Button
        variant="link"
        className="mt-3.5 block w-full px-1.5 py-1.5 text-[13px]"
        onClick={onLogin}
      >
        I already have an account · Log in
      </Button>
      <Button
        variant="link"
        className="mt-3.5 block w-full px-1.5 py-1.5 text-[13px]"
        onClick={onStaff}
      >
        Namma MedMate staff sign in
      </Button>
    </Stack>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <Stack direction="row" align="center" className="gap-[7px] text-[12.5px] text-ink-2">
      <Box className="shrink-0 text-mid">
        <IconCheck size={13} />
      </Box>
      <Text as="span" className="text-[12.5px] text-ink-2">
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
        "relative h-auto w-full flex-col items-stretch justify-start gap-0 rounded-md border-[1.5px] px-[18px] py-4 text-left whitespace-normal hover:border-light hover:bg-paper active:translate-y-0",
        selected
          ? "border-mid bg-wash-2 shadow-[0_0_0_3px_#2f7d521f] hover:border-mid hover:bg-wash-2"
          : "border-line-2 bg-paper",
      )}
    >
      <Box className="inline-grid place-items-center">
        <GlyphView glyph={item.icon} size={30} />
      </Box>
      <Stack className="mt-1.5">
        <Text as="span" className="font-display text-[16px] font-bold text-dark">
          {item.title}
        </Text>
        <Text as="span" className="mt-px text-[12.5px] text-muted">
          {item.body}
        </Text>
      </Stack>
      <Stack className="mt-3 gap-[5px]">
        <Bullets items={item.bullets} />
      </Stack>
      <Box
        className={cn(
          "absolute top-4 right-4 h-5 w-5 rounded-full border-2",
          selected ? "border-mid bg-mid shadow-[inset_0_0_0_3px_#fff]" : "border-line-2",
        )}
      />
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
    <Stack className="animate-[pd-ob-in_0.25s_ease] motion-reduce:animate-none">
      <Heading level={2} className="text-[24px]">
        Choose your business
      </Heading>
      <Text className="mt-1.5 mb-[22px] text-[13.5px] text-muted">
        This choice stays with this mobile number.
      </Text>
      <Stack className="gap-3">{TYPES.map(renderType)}</Stack>
      <Stack direction="row" justify="between" className="mt-[22px] gap-2.5">
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
  const heading = otpSent
    ? "Enter the OTP"
    : pinMode
      ? "Enter your PIN"
      : staff
        ? "Staff sign in"
        : "Log in to continue";
  const subtitle = otpSent
    ? `We sent a 6-digit code to ${phone}.`
    : pinMode
      ? "Use the 4-digit PIN you created after signup."
      : staff
        ? "Staff sign in uses a one-time code."
        : "New pharmacies get a code by SMS. After that, sign in with your PIN.";

  return (
    <Stack className="animate-[pd-ob-in_0.25s_ease] motion-reduce:animate-none">
      <Text
        as="span"
        className="mb-3.5 inline-block w-fit self-start rounded-[99px] bg-wash px-3 py-[5px] text-[12.5px] font-extrabold text-dark [&_svg]:inline [&_svg]:align-baseline"
      >
        {staff ? (
          "Master"
        ) : (
          <>
            <GlyphView glyph={chosen.icon} size={15} /> {chosen.title}
          </>
        )}
      </Text>
      <Heading level={2} className="text-[24px]">
        {heading}
      </Heading>
      <Text className="mt-1.5 mb-[22px] text-[13.5px] text-muted">{subtitle}</Text>
      {!otpSent && !pinMode ? (
        <Stack className="gap-0">
          {staff ? null : (
            <Field
              label={
                <>
                  Business name <span className="font-semibold text-faint">(optional)</span>
                </>
              }
            >
              <Input
                value={name}
                onChange={onName}
                placeholder={
                  type === "hospital" ? "City Care Hospital Pharmacy" : "Sri Sai Medicals"
                }
              />
            </Field>
          )}
          <Field
            className="mt-3"
            label="Mobile number"
            error={formFault?.field === "phone" ? formFault.message : undefined}
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
                onChange={onPhone}
                onKeyDown={onPhoneKey}
                placeholder="98860 12345"
                autoFocus
                aria-invalid={formFault?.field === "phone"}
              />
            </Stack>
          </Field>
          <Button size="lg" block className="mt-[22px]" disabled={!phoneOk} onClick={continuePhone}>
            {staff ? "Send OTP" : "Continue"} <IconArrowRight size={16} />
          </Button>
        </Stack>
      ) : null}
      {pinMode && !otpSent ? (
        <Stack className="gap-0">
          <Field
            label="4-digit PIN"
            error={formFault?.field === "pin" ? formFault.message : undefined}
            data-field="pin"
          >
            <Input
              className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
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
          <Button
            size="lg"
            block
            className="mt-[22px]"
            disabled={pin.length !== 4}
            onClick={verify}
          >
            <IconCheck size={16} /> Log in
          </Button>
          <Button
            variant="link"
            className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]"
            onClick={onForgot}
          >
            Forgot PIN
          </Button>
        </Stack>
      ) : null}
      {otpSent ? (
        <Stack className="gap-0">
          <Field
            label="6-digit OTP"
            error={formFault?.field === "otp" ? formFault.message : undefined}
            data-field="otp"
          >
            <Input
              ref={otpRef}
              className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
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
            <Text className="mt-2.5 rounded-sm border border-dashed border-line-2 bg-wash-2 px-3 py-2 text-[12.5px] text-muted">
              Demo OTP:{" "}
              <Text as="span" className="font-bold">
                {demoCode}
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
            onClick={verify}
          >
            <IconCheck size={16} /> {staff ? "Verify & open master" : "Verify & log in"}
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
    <Stack
      data-slot="onboarding-carousel"
      direction="row"
      className={cn(
        "h-screen w-full overflow-auto bg-canvas max-[767px]:h-auto max-[767px]:min-h-dvh",
        className,
      )}
    >
      <Aside type={type} />
      <Stack className="grid min-w-0 flex-1 place-items-center p-8 max-[767px]:px-4 max-[767px]:py-5">
        <Stack className="w-full max-w-[440px]">
          {phase === "intro" ? (
            <IntroPhase
              slide={slide}
              onPick={pickSlide}
              onStart={start}
              onLogin={login}
              onStaff={staffLogin}
            />
          ) : null}
          {phase === "type" ? (
            <TypePhase
              type={type}
              onType={chooseType}
              onBack={backToIntro}
              onContinue={continueType}
            />
          ) : null}
          {phase === "login" ? (
            <LoginPhase staff={staff} type={type} onBack={backToIntro} onMaster={onMaster} />
          ) : null}
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
        <Field label="4-digit PIN" data-field="pin">
          <Input
            className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
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
        <Field
          className="mt-3"
          label="Confirm PIN"
          error={formFault?.field === "pin" ? formFault.message : undefined}
        >
          <Input
            className="text-center font-mono text-[22px] font-extrabold tracking-[0.28em]"
            inputMode="numeric"
            maxLength={4}
            type="password"
            value={again}
            onChange={onAgain}
            onKeyDown={onAgainKey}
            placeholder="••••"
          />
        </Field>
        <Button
          size="lg"
          block
          className="mt-[22px]"
          disabled={pin.length !== 4 || again.length !== 4}
          onClick={save}
        >
          <IconCheck size={16} /> Save PIN
        </Button>
        <Button
          variant="link"
          className="mt-3.5 block w-full px-1.5 py-1.5 text-center text-[13px]"
          onClick={signOut}
        >
          Log out
        </Button>
      </Stack>
    </Stack>
  );
}
