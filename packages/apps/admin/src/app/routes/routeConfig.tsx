import type { ReactNode } from "react";
import type { NavEntry } from "@/components/layout";
import { IconCheck, IconDashboard, IconStore } from "@/components/ui/Icon";
import type { Account } from "@/types";
import { canReview } from "@/features/authentication";
import { DashboardPage } from "@/features/dashboard";
import { PharmaciesPage } from "@/features/pharmacies";
import { ReviewsPage } from "@/features/reviews";

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
];

export function navRoutes(account: Account | null | undefined): AppRoute[] {
  return appRoutes.filter((route) => route.path !== "/reviews" || canReview(account));
}
