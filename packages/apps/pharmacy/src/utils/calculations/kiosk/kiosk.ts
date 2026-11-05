import type { PayMode } from "@/utils/calculations/selling";

// ── self-order kiosk (Mc-model) ─────────────────────────────────
export type KioskConfig = {
  enabled: boolean;
  displayName: string;
  pin: string;
  welcome: string;
  showPrices: boolean;
  allowRx: boolean;
  payModes: PayMode[];
  idleResetSec: number;
  accent: "green" | "dark" | "gold";
};
export const DEFAULT_KIOSK: KioskConfig = {
  enabled: true,
  displayName: "",
  pin: "",
  welcome: "Tap to order your medicines & wellness products",
  showPrices: true,
  allowRx: true,
  payModes: ["upi", "card", "cash"],
  idleResetSec: 60,
  accent: "green",
};
