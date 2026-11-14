import type { ReactNode } from "react";
import type { NavEntry } from "@/components/layout";
import {
  IconCheck,
  IconDashboard,
  IconGlobe,
  IconHelp,
  IconReceipt,
  IconRx,
  IconStore,
} from "@/components/ui/Icon";
import type { Account } from "@/types";
import {
  canManageCatalog,
  canPrepareInventory,
  canReview,
  canSupport,
} from "@/features/authentication";
import { CatalogPage } from "@/features/catalog";
import { PrepListPage } from "@/features/prep";
import { DashboardPage } from "@/features/dashboard";
import { LeadsPage } from "@/features/leads";
import { PharmaciesPage } from "@/features/pharmacies";
import { ReviewsPage } from "@/features/reviews";
import { SupportPage } from "@/features/support";

export type AppRoute = NavEntry & { element: ReactNode };

export const appRoutes: AppRoute[] = [
  {
    path: "/dashboard",
    label: "Home",
    title: "Home",
    sub: "Platform",
    icon: <IconDashboard size={19} />,
    element: <DashboardPage />,
  },
  {
    path: "/pharmacies",
    label: "Pharmacies",
    title: "Pharmacies",
    sub: "Owners",
    group: "Pharmacies",
    icon: <IconStore size={19} />,
    element: <PharmaciesPage />,
  },
  {
    path: "/reviews",
    label: "Reviews",
    title: "Reviews",
    sub: "Applications",
    icon: <IconCheck size={19} />,
    element: <ReviewsPage />,
  },
  {
    path: "/support",
    label: "Support",
    title: "Support",
    sub: "FAQs and cases",
    group: "Support",
    icon: <IconHelp size={19} />,
    element: <SupportPage />,
  },
  {
    path: "/leads",
    label: "Leads",
    title: "Leads",
    sub: "Website forms",
    group: "Leads",
    icon: <IconGlobe size={19} />,
    element: <LeadsPage />,
  },
  {
    path: "/catalog",
    label: "Manage Catalog",
    title: "Manage Catalog",
    sub: "Drugs and FMCG",
    group: "Catalog",
    icon: <IconRx size={19} />,
    element: <CatalogPage />,
  },
  {
    path: "/inventory-prep",
    label: "Prepare Inventory",
    title: "Prepare Inventory",
    sub: "Opening stock",
    icon: <IconReceipt size={19} />,
    element: <PrepListPage />,
  },
];

export function navRoutes(account: Account | null | undefined): AppRoute[] {
  return appRoutes.filter((route) => {
    if (route.path === "/reviews") return canReview(account);
    if (route.path === "/support" || route.path === "/leads") return canSupport(account);
    if (route.path === "/catalog") return canManageCatalog(account);
    if (route.path === "/inventory-prep") return canPrepareInventory(account);
    return true;
  });
}
