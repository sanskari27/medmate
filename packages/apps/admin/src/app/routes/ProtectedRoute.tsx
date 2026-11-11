import { Navigate, Outlet } from "react-router-dom";
import { canUseAdminPortal, useAuthState } from "@/features/authentication";

function needsPin(session: ReturnType<typeof useAuthState>["session"], pinReset: boolean) {
  return Boolean(session && (session.account.pinSetupRequired || pinReset));
}

function allowedSession(session: ReturnType<typeof useAuthState>["session"]) {
  return Boolean(session && canUseAdminPortal(session.account));
}

export function ProtectedRoute() {
  const { session, pinReset } = useAuthState();
  if (!allowedSession(session) || !session) return <Navigate to="/" replace />;
  if (needsPin(session, pinReset)) return <Navigate to="/pin" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { session, pinReset } = useAuthState();
  if (!allowedSession(session) || !session) return <Outlet />;
  if (needsPin(session, pinReset)) return <Navigate to="/pin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export function PinRoute() {
  const { session, pinReset } = useAuthState();
  if (!allowedSession(session) || !session) return <Navigate to="/" replace />;
  if (!needsPin(session, pinReset)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
