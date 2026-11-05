import type { DashboardProps } from "./Dashboard.types";
import { Box } from "@/components/atoms";
import type { KeyboardEvent } from "react";
type Desk =
  | "dashboard"
  | "pharmacies"
  | "kyc"
  | "subscriptions"
  | "coupons"
  | "requests"
  | "support"
  | "consultations"
  | "referrals"
  | "activity";
export function Dashboard({ counts, onOpen }: DashboardProps) {
  const cards: {
    key: Desk;
    label: string;
    hint: string;
    accent: string;
  }[] = [
    { key: "pharmacies", label: "Pharmacies", hint: "On this server", accent: "accent-green" },
    {
      key: "kyc",
      label: "KYC incomplete",
      hint: "GSTIN, PAN, or drug licence",
      accent: "accent-gold",
    },
    {
      key: "subscriptions",
      label: "Subscriptions due",
      hint: "Expired or renewing in 30 days",
      accent: "accent-rose",
    },
    {
      key: "requests",
      label: "Plan requests",
      hint: "Waiting to be handled",
      accent: "accent-blue",
    },
    { key: "support", label: "Open tickets", hint: "Support inbox", accent: "accent-green" },
  ];
  return (
    <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
      {cards.map(renderCard)}
    </Box>
  );
  function renderCard(card: { key: Desk; label: string; hint: string; accent: string }) {
    return (
      <Box
        key={card.key}
        className={`group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm ${card.accent} !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid`}
        role="button"
        tabIndex={0}
        onClick={onOpenOnClick}
        onKeyDown={onOpenOnKeyDown}
      >
        <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
          {card.label}
        </Box>
        <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
          {
            counts[
              card.key === "pharmacies"
                ? "pharmacies"
                : card.key === "kyc"
                  ? "kyc"
                  : card.key === "subscriptions"
                    ? "due"
                    : card.key === "requests"
                      ? "requests"
                      : "tickets"
            ]
          }
        </Box>
        <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
          {card.hint}
        </Box>
      </Box>
    );
    function onOpenOnClick() {
      return onOpen(card.key);
    }
    function onOpenOnKeyDown(event: KeyboardEvent<HTMLDivElement>) {
      if (event.key === "Enter") onOpen(card.key);
    }
  }
}
