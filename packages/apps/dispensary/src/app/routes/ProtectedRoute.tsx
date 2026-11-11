import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/app/store";
import { selectHomePath } from "@/features/setup";

function useDestination() {
  return useAppSelector((state) => selectHomePath(state));
}

export function ProtectedRoute() {
  const next = useDestination();
  if (next !== "/dashboard") return <Navigate to={next} replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const next = useDestination();
  if (next !== "/") return <Navigate to={next} replace />;
  return <Outlet />;
}

export function PinRoute() {
  const next = useDestination();
  if (next !== "/pin") return <Navigate to={next} replace />;
  return <Outlet />;
}

export function SetupRoute() {
  const next = useDestination();
  if (next !== "/setup") return <Navigate to={next} replace />;
  return <Outlet />;
}

export function StatusRoute() {
  const next = useDestination();
  if (next !== "/application-status") return <Navigate to={next} replace />;
  return <Outlet />;
}

export function RestrictedRoute() {
  const next = useDestination();
  if (next !== "/account-restricted") return <Navigate to={next} replace />;
  return <Outlet />;
}
