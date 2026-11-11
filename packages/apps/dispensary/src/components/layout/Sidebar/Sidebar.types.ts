import type { ReactNode } from "react";

export type NavEntry = {
  path: string;
  label: string;
  title: string;
  sub: string;
  icon: ReactNode;
  group?: string;
};

export type SidebarProps = {
  items: NavEntry[];
  currentPath: string;
  open: boolean;
  displayName: string;
  roleLabel: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
};
