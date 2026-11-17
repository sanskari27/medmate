import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAppSelector } from "@/app/store/hooks";
import type { Session } from "@/types";

/**
 * A session counts as signed in once the account has its PIN. An account that
 * has just proved its phone still has to choose one, so it belongs on the
 * sign-in screen until it does.
 */
export function isSignedIn(session: Session | null): boolean {
  if (!session) return false;
  return session.account?.pinSetupRequired !== true;
}

/** A screen that needs a signed-in clinic account. */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const session = useAppSelector((state) => state.auth.session);
  if (!isSignedIn(session)) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/** A screen that only a visitor without a session may see. */
export function GuestRoute({ children }: { children: ReactNode }) {
  const session = useAppSelector((state) => state.auth.session);
  if (isSignedIn(session)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
