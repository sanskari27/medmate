import type { ComponentProps, ReactNode } from "react";

export type TabProps = Omit<ComponentProps<"button">, "children"> & {
  selected?: boolean;
  children: ReactNode;
};

export type TabsProps = {
  label: string;
  children: ReactNode;
  className?: string;
};
