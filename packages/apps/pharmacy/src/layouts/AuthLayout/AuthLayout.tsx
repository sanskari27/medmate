import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return <div style={{ display: "contents" }}>{children}</div>;
}
