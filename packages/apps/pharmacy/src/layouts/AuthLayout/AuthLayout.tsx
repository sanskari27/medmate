import { Stack } from "@/components/atoms";
import type { AuthLayoutProps } from "./AuthLayout.types";

export function AuthLayout({ children }: AuthLayoutProps) {
  return <Stack className="contents">{children}</Stack>;
}
