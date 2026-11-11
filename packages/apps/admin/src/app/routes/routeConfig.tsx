import type { ReactNode } from "react";
import type { NavEntry } from "@/components/layout";
import { IconCheck, IconDashboard, IconHelp, IconStore } from "@/components/ui/Icon";
import type { Account } from "@/types";
import { canReview, canSupport } from "@/features/authentication";
import { DashboardPage } from "@/features/dashboard";
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
    path: "/reviews",
    label: "Reviews",
    title: "Reviews",
    sub: "Applications",
    icon: <IconCheck size={19} />,
    element: <ReviewsPage />,
  },
  {
    path: "/pharmacies",
    label: "Pharmacies",
    title: "Pharmacies",
    sub: "Owners",
    icon: <IconStore size={19} />,
    element: <PharmaciesPage />,
  },
  {
    path: "/support",
    label: "Support",
    title: "Support",
    sub: "FAQs and cases",
    icon: <IconHelp size={19} />,
    element: <SupportPage />,
  },
];

export function navRoutes(account: Account | null | undefined): AppRoute[] {
  return appRoutes.filter((route) => {
    if (route.path === "/reviews") return canReview(account);
    if (route.path === "/support") return canSupport(account);
    return true;
  });
}
