import type { ReactNode } from "react";
import {
  IconDashboard,
  IconHelp,
  IconTruck,
  IconReceipt,
  IconStore,
  IconUser,
  IconUsers,
} from "@/components/ui/Icon";
import { DashboardPage } from "@/features/dashboard";
import { DistributorsPage } from "@/features/distributors";
import { InventoryPage } from "@/features/inventory";
import { PurchasesPage } from "@/features/purchases";
import { EmployeesPage } from "@/features/employees";
import { InvoiceSettingsPage } from "@/features/invoice-settings";
import { ProfilePage } from "@/features/profile";
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
    path: "/distributors",
    label: "Distributors",
    title: "Distributors",
    sub: "Your distributor & supplier directory",
    group: "Catalogue",
    icon: <IconTruck size={19} />,
    element: <DistributorsPage />,
  },
  {
    path: "/purchases",
    label: "Purchases",
    title: "Purchases",
    sub: "Distributor bills and returns",
    icon: <IconReceipt size={19} />,
    element: <PurchasesPage />,
  },
  {
    path: "/inventory",
    label: "Inventory",
    title: "Inventory",
    sub: "Stock, batches and expiry",
    icon: <IconStore size={19} />,
    element: <InventoryPage />,
  },
  {
    path: "/employees",
    label: "Employees",
    title: "Employees",
    sub: "Team records, payroll & bank details",
    group: "Management",
    icon: <IconUsers size={19} />,
    element: <EmployeesPage />,
  },
  {
    path: "/invoice-settings",
    label: "Invoice Settings",
    title: "Invoice Settings",
    sub: "Customise your GST invoice",
    icon: <IconReceipt size={19} />,
    element: <InvoiceSettingsPage />,
  },
  {
    path: "/users",
    label: "Manage Users",
    title: "Manage Users",
    sub: "Staff & access",
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
