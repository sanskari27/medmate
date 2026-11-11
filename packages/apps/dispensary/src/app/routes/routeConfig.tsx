import type { ReactNode } from "react";
import { IconDashboard, IconReports, IconSettings, IconUsers } from "@/components/ui/Icon";
import { DashboardPage } from "@/features/dashboard";
import { ReportsPage } from "@/features/reports";
import { SettingsPage } from "@/features/settings";
import { UsersPage } from "@/features/users";
import type { NavEntry } from "@/components/layout";

export type AppRoute = NavEntry & { element: ReactNode };

export const appRoutes: AppRoute[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    title: "Dashboard",
    sub: "Today at a glance",
    icon: <IconDashboard size={19} />,
    element: <DashboardPage />,
  },
  {
    path: "/users",
    label: "Manage Users",
    title: "Manage Users",
    sub: "Staff roles & access",
    icon: <IconUsers size={19} />,
    element: <UsersPage />,
  },
  {
    path: "/settings",
    label: "Settings",
    title: "Settings",
    sub: "Pharmacy profile & licences",
    icon: <IconSettings size={19} />,
    element: <SettingsPage />,
  },
  {
    path: "/reports",
    label: "Reports",
    title: "Reports",
    sub: "Sales & GST summary",
    icon: <IconReports size={19} />,
    element: <ReportsPage />,
  },
];
