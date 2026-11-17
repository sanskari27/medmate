import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAppSelector } from "@/app/store/hooks";

/** A screen that needs a signed-in clinic account. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useAppSelector((state) => state.auth.session);
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** A screen that only a signed-out visitor may see. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const session = useAppSelector((state) => state.auth.session);
  if (session) return <Navigate to="/" replace />;
  return <>{children}</>;
}
