import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "@/components/layout";
import {
  LoginPage,
  PinSetupPage,
  pharmacyRoleLabel,
  useAuthActions,
  useAuthState,
} from "@/features/authentication";
import { AccountRestrictedPage, ApplicationStatusPage, SetupPage } from "@/features/setup";
import { SupportPage } from "@/features/support";
import {
  GuestRoute,
  PinRoute,
  ProtectedRoute,
  RestrictedRoute,
  SetupRoute,
  StatusRoute,
} from "./ProtectedRoute";
import { appRoutes } from "./routeConfig";

export function AppRouter() {
  const { session } = useAuthState();
  const auth = useAuthActions();
  const owner = session?.account.pharmacyRole === "owner";
  const items = appRoutes.filter((route) => route.path !== "/support" || owner);
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/" element={<LoginPage />} />
      </Route>
      <Route element={<PinRoute />}>
        <Route path="/pin" element={<PinSetupPage />} />
      </Route>
      <Route element={<SetupRoute />}>
        <Route path="/setup" element={<SetupPage />} />
      </Route>
      <Route element={<StatusRoute />}>
        <Route path="/application-status" element={<ApplicationStatusPage />} />
      </Route>
      <Route element={<RestrictedRoute />}>
        <Route path="/account-restricted" element={<AccountRestrictedPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <DashboardLayout
              items={items}
              displayName={session?.account.displayName || "Pharmacist"}
              roleLabel={pharmacyRoleLabel(session?.account.pharmacyRole)}
              onSignOut={() => void auth.signOut()}
            />
          }
        >
          {items
            .filter((route) => route.path !== "/support")
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          <Route
            path="/support"
            element={owner ? <SupportPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/support/:caseId"
            element={owner ? <SupportPage /> : <Navigate to="/dashboard" replace />}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
