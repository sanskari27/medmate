import type { ReactNode } from "react";
import {
  IconDashboard,
  IconHelp,
  IconReports,
  IconSettings,
  IconUser,
  IconUsers,
} from "@/components/ui/Icon";
import { DashboardPage } from "@/features/dashboard";
import { ProfilePage } from "@/features/profile";
import { ReportsPage } from "@/features/reports";
import { SettingsPage } from "@/features/settings";
import { SupportPage } from "@/features/support";
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
  {
    path: "/users",
    label: "Manage Users",
    title: "Manage Users",
    sub: "Staff & access",
    group: "Management",
    icon: <IconUsers size={19} />,
    element: <UsersPage />,
  },
  {
    path: "/profile",
    label: "Profile",
    title: "Profile",
    sub: "Edit your pharmacy details — shown on invoices & reports",
    icon: <IconUser size={19} />,
    element: <ProfilePage />,
  },
  {
    path: "/support",
    label: "Help & Support",
    title: "Help & Support",
    sub: "FAQs, tickets & contact",
    icon: <IconHelp size={19} />,
    element: <SupportPage />,
  },
];
