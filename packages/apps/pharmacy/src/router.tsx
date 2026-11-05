import type { Route } from "@/app/session/pharmacy-provider";

export const pathForRoute: Record<Route, string> = {
  dashboard: "/",
  pos: "/pos",
  orders: "/orders",
  sales: "/sales",
  inventory: "/inventory",
  rackmap: "/rackmap",
  prescriptions: "/prescriptions",
  purchases: "/purchases",
  reorder: "/reorder",
  distributors: "/distributors",
  online: "/online",
  offers: "/offers",
  kiosk: "/kiosk",
  reports: "/reports",
  ca: "/ca",
  customers: "/customers",
  expenses: "/expenses",
  employees: "/employees",
  khata: "/khata",
  crm: "/crm",
  account: "/account",
  users: "/users",
  invoicing: "/invoicing",
  subscription: "/subscription",
  refer: "/refer",
  support: "/support",
  settings: "/settings",
  menu: "/menu",
  wards: "/wards",
  indents: "/indents",
  departments: "/departments",
  doctors: "/doctors",
  salesreg: "/sales-register",
  ptbills: "/patient-bills",
  hospbill: "/hospital-billing",
  notifications: "/notifications",
};

export function routeFromPath(pathname: string): Route {
  const match = (Object.entries(pathForRoute) as [Route, string][]).find(([, routePath]) => routePath === pathname);
  return match?.[0] ?? "dashboard";
}
