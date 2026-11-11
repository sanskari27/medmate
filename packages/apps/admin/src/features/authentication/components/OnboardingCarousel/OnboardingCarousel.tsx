import { useEffect, useId, useState, type ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { IconArrowRight, IconCheck, IconReports, IconStore } from "@/components/ui/Icon";
import { cn } from "@/utils/className";
import { LoginPhase } from "./LoginPhase";

type OnboardingCarouselProps = { className?: string };

type Phase = "intro" | "login";
type Glyph = (props: { size?: number }) => ReactNode;

const SLIDES: { icon: Glyph; title: string; body: string }[] = [
  {
    icon: IconCheck,
    title: "Review pharmacy applications",
    body: "Compliance and final approval stay in one queue.",
  },
  {
    icon: IconStore,
    title: "Pharmacies and their owners",
    body: "See each pharmacy, its owner, and whether that account can sign in.",
  },
  {
    icon: IconReports,
    title: "A number for each teammate",
    body: "Platform admin, compliance, finance, sales, and support each sign in with their own mobile number.",
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
          Admin console
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

function Aside() {
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
          Review pharmacies
          <br />
          from one screen.
        </Heading>
        <Text className="mt-3.5 max-w-[420px] text-[15px] leading-normal text-white/80">
          Applications, pharmacy owners, and platform staff — one console for the Namma MedMate
          team.
        </Text>
      </Stack>
      <Stack className="relative z-[1] mt-7 gap-2.5">
        <TrustRow icon={IconCheck} label="Application review" />
        <TrustRow icon={IconStore} label="Owner access" />
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
}: {
  slide: number;
  onPick: (index: number) => void;
  onStart: () => void;
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
    </Stack>
  );
}

export function OnboardingCarousel({ className }: OnboardingCarouselProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [slide, setSlide] = useState(0);

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
    setPhase("login");
  }
  function backToIntro() {
    setPhase("intro");
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
      <Aside />
      <Stack className="grid min-w-0 flex-1 place-items-center p-8 max-[767px]:px-4 max-[767px]:py-5">
        <Stack className="w-full max-w-[440px]">
          {phase === "intro" ? (
            <IntroPhase slide={slide} onPick={pickSlide} onStart={start} />
          ) : null}
          {phase === "login" ? <LoginPhase onBack={backToIntro} /> : null}
        </Stack>
      </Stack>
    </Stack>
  );
}
