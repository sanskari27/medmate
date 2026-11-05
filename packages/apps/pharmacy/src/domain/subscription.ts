// ── subscription / SaaS plan ────────────────────────────────────
export type Plan = "Essential" | "Care" | "Growth" | "Flagship";
export type PlanInfo = {
  key: Plan;
  name: string;
  price: number;
  annual: number;
  seats: string;
  tagline: string;
  features: string[];
};
export const PLANS: PlanInfo[] = [
  {
    key: "Essential",
    name: "Essential",
    price: 0,
    annual: 0,
    seats: "2 users",
    tagline: "Core billing",
    features: [
      "Billing / POS & GST invoices",
      "Inventory, batches & expiry",
      "Purchases & goods-inward",
      "Up to 2 users",
    ],
  },
  {
    key: "Care",
    name: "Care",
    price: 999,
    annual: 899,
    seats: "2 users",
    tagline: "Single counter",
    features: ["Everything in Essential", "All paid screens on any active plan", "Email support"],
  },
  {
    key: "Growth",
    name: "Growth",
    price: 1499,
    annual: 1299,
    seats: "5 users",
    tagline: "Most popular",
    features: ["Everything in Care", "All paid screens on any active plan", "Up to 5 users"],
  },
  {
    key: "Flagship",
    name: "Flagship",
    price: 2499,
    annual: 2199,
    seats: "Unlimited",
    tagline: "Hospital, kiosk & more",
    features: [
      "Everything in Growth",
      "All paid screens on any active plan",
      "Unlimited users & branches",
      "Priority support",
    ],
  },
];
export type BillingCycle = "monthly" | "annual";
export const GST_RATE = 0.18; // SaaS subscription GST
// Stored rows may still say Free, Starter, or Pro. Reads accept those names.
export const asPlan = (value: unknown): Plan | null => {
  if (value === "Essential" || value === "Free") return "Essential";
  if (value === "Care" || value === "Starter") return "Care";
  if (value === "Growth") return "Growth";
  if (value === "Flagship" || value === "Pro") return "Flagship";
  return null;
};
export const isFreePlan = (plan: string) => asPlan(plan) === "Essential";
// list price for a plan on the chosen billing cycle (annual = 12 × the annual per-month rate)
export const planPrice = (p: PlanInfo, cycle: BillingCycle): number =>
  cycle === "annual" ? p.annual * 12 : p.price;
export const annualSavings = (p: PlanInfo): number => (p.price - p.annual) * 12;
export const annualPerMonth = (p: PlanInfo): number => p.annual;
export const annualOff = (p: PlanInfo): number =>
  p.price ? Math.round(((p.price - p.annual) / p.price) * 100) : 0;
export const cycleNoun = (c: BillingCycle) => (c === "annual" ? "year" : "month");

export type Subscription = {
  plan: Plan;
  cycle: BillingCycle;
  status: "active" | "expiring" | "expired";
  renewsOn: string;
  since: string;
  autoRenew: boolean;
};
export type SubRequest = {
  id: string;
  plan: Plan;
  cycle: BillingCycle;
  kind: "plan" | "renewal";
  createdAt: number;
  status: "open" | "handled";
};
export const DEFAULT_SUBSCRIPTION: Subscription = {
  plan: "Essential",
  cycle: "monthly",
  status: "active",
  renewsOn: "—",
  since: "2026-07-01",
  autoRenew: false,
};
export const todayISO = (now = new Date()) => now.toISOString().slice(0, 10);
export const subscriptionLapsed = (sub: Subscription, today = todayISO()) =>
  !isFreePlan(sub.plan) &&
  (sub.status === "expired" || (/^\d{4}-\d{2}-\d{2}$/.test(sub.renewsOn) && sub.renewsOn < today));

// ── freemium gating ─────────────────────────────────────────────
// Core features that are FREE FOR EVERYONE, forever — no subscription needed.
export const FREE_ROUTES: string[] = ["pos", "inventory", "purchases", "invoicing", "users"];
// Account / shell routes that are always reachable (so users can manage & upgrade).
export const ALWAYS_ROUTES: string[] = [
  "dashboard",
  "account",
  "subscription",
  "settings",
  "support",
  "notifications",
  "menu",
  "refer",
];
export const HOSPITAL_ROUTES = [
  "wards",
  "hospbill",
  "ptbills",
  "salesreg",
  "indents",
  "departments",
  "doctors",
];
export const PREMIUM_ROUTES = [
  "orders",
  "sales",
  "prescriptions",
  "customers",
  "khata",
  "crm",
  "rackmap",
  "reorder",
  "distributors",
  "online",
  "offers",
  "kiosk",
  "reports",
  "expenses",
  "ca",
  "employees",
  ...HOSPITAL_ROUTES,
];
export type ScreenGrant = { route: string; until?: string };
export type AccessOpts = {
  grants?: ScreenGrant[];
  businessType?: "pharmacy" | "hospital";
  today?: string;
};
// a paid plan (Essential never unlocks the premium modules; expired plans lock too)
export const planUnlocksAll = (sub: Subscription) =>
  !isFreePlan(sub.plan) && !subscriptionLapsed(sub);
export const routeIsFree = (route: string) =>
  FREE_ROUTES.includes(route) || ALWAYS_ROUTES.includes(route);
export const includedSeats = (plan: string): number | null => {
  const named = asPlan(plan);
  return named === "Flagship" ? null : named === "Growth" ? 5 : 2;
};
export const SEAT_CAP = 50;
export const seatCeiling = (plan: Plan, extraSeats: number): number | null => {
  const included = includedSeats(plan);
  return included == null ? null : included + Math.max(0, extraSeats || 0);
};
const grantOpen = (grant: ScreenGrant, today: string) => !grant.until || grant.until >= today;
// Hospital screens need a hospital pharmacy. A paid plan opens every other premium screen.
// Grants apply only while the plan is Essential or the paid term has lapsed.
export const routeLocked = (route: string, sub: Subscription, access?: AccessOpts) => {
  if (HOSPITAL_ROUTES.includes(route) && access?.businessType !== "hospital") return true;
  if (routeIsFree(route)) return false;
  if (planUnlocksAll(sub)) return false;
  const today = access?.today || todayISO();
  return !(access?.grants || []).some((grant) => grant.route === route && grantOpen(grant, today));
};
// smallest paid plan that unlocks a given premium route (for the upsell copy)
export const planForRoute = (route: string): Plan => {
  if (route === "prescriptions" || route === "customers" || route === "khata") return "Care";
  if (
    [
      "wards",
      "hospbill",
      "ptbills",
      "salesreg",
      "indents",
      "departments",
      "doctors",
      "kiosk",
    ].includes(route)
  )
    return "Flagship";
  return "Growth";
};
