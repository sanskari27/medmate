import { useId } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconLogout } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { isNavActive } from "../navMatch";
import type { SidebarProps } from "./Sidebar.types";

function BrandMark() {
  const gradientId = useId().replace(/:/g, "");
  return (
    <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-paper shadow-[0_4px_12px_#00000040]">
      <svg width={24} height={24} viewBox="0 0 40 40" fill="none" aria-hidden>
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
  );
}

export function Sidebar({
  items,
  currentPath,
  open,
  displayName,
  roleLabel,
  onNavigate,
  onSignOut,
}: SidebarProps) {
  const initial = (displayName.trim()[0] || "P").toUpperCase();
  return (
    <Stack
      data-slot="app-sidebar"
      className={cn(
        "h-dvh w-[248px] shrink-0 border-r border-black/20 bg-[linear-gradient(180deg,#10301d,#0c2516)] text-white motion-reduce:transition-none max-[1099px]:fixed max-[1099px]:top-0 max-[1099px]:left-0 max-[1099px]:z-40 max-[1099px]:-translate-x-[105%] max-[1099px]:transition-transform max-[1099px]:duration-[180ms] max-[1099px]:ease-[ease]",
        open && "max-[1099px]:translate-x-0",
      )}
    >
      <Stack direction="row" align="center" className="gap-2.5 px-[18px] pt-[18px] pb-4">
        <BrandMark />
        <span className="block leading-[1.5]">
          <Text
            as="span"
            className="block font-display text-[15px] font-extrabold tracking-[-0.01em] text-white"
          >
            <span className="text-gold">Namma</span> MedMate
          </Text>
          <Text as="span" className="text-[9px] font-bold tracking-[0.14em] text-mint uppercase">
            Partner Console
          </Text>
        </span>
      </Stack>
      <Stack data-slot="nav" className="min-h-0 flex-1 gap-0.5 overflow-y-auto px-3 py-1.5">
        {items.map((item) => {
          const active = isNavActive(item.path, currentPath);
          return (
            <span key={item.path} className="block">
              {item.group ? (
                <Text
                  as="span"
                  data-slot="nav-section-label"
                  className="block px-2.5 pt-4 pb-1.5 text-[10px] font-extrabold tracking-[0.14em] text-[#8fd4a87a] uppercase"
                >
                  {item.group}
                </Text>
              ) : null}
              <Button
                variant="ghost"
                aria-current={active ? "page" : undefined}
                onClick={() => onNavigate(item.path)}
                className={cn(
                  "relative h-auto w-full justify-start gap-[11px] rounded-sm border-0 bg-transparent px-3 py-2 text-left text-[13px] font-semibold text-[#ffffffa8] shadow-none hover:bg-[#ffffff12] hover:text-white active:translate-y-0",
                  active &&
                    "bg-[#ffffff1a] font-bold text-white before:absolute before:top-1/2 before:-left-3 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-r-[3px] before:bg-mint before:content-['']",
                )}
              >
                <Box
                  className={cn(
                    "grid h-5 w-5 shrink-0 place-items-center",
                    active ? "opacity-100" : "opacity-80",
                  )}
                >
                  {item.icon}
                </Box>
                {item.label}
              </Button>
            </span>
          );
        })}
      </Stack>
      <Stack className="border-t border-white/[0.09] px-3.5 pt-3.5 pb-1">
        <Stack direction="row" align="center" className="gap-2.5">
          <Box className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-mint font-display text-[14px] font-extrabold text-deep">
            {initial}
          </Box>
          <Stack className="min-w-0 flex-1">
            <Text as="span" className="truncate text-[12.5px] leading-[1.3] font-bold text-white">
              {displayName}
            </Text>
            <Text
              as="span"
              className="block text-[10.5px] leading-[1.3] font-medium text-[#ffffff73]"
            >
              {roleLabel}
            </Text>
          </Stack>
          <button
            type="button"
            title="Log out"
            aria-label="Log out"
            onClick={onSignOut}
            className="ml-auto grid h-[30px] w-[30px] shrink-0 place-items-center rounded-sm border border-white/[0.14] bg-[#ffffff0d] text-[#ffffffb3] hover:border-[#dc262680] hover:bg-[#dc262640] hover:text-white"
          >
            <IconLogout size={17} />
          </button>
        </Stack>
        <Text
          as="span"
          className="block w-full px-3 pt-2 pb-3 text-center text-[10px] leading-[1.5] tracking-[0.01em] text-white/40"
        >
          © 2026 Medmate India Technology Private Limited
        </Text>
      </Stack>
    </Stack>
  );
}
