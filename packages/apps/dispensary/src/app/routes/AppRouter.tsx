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
import { ProfilePage } from "@/features/profile";
import { SupportPage } from "@/features/support";
import { UsersPage } from "@/features/users";
import { EmployeesPage, canOpenEmployees } from "@/features/employees";
import { DistributorsPage, canOpenDistributors } from "@/features/distributors";
import { InvoiceSettingsPage, canOpenInvoiceSettings } from "@/features/invoice-settings";
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
  const employeesOpen = canOpenEmployees(
    session?.account.pharmacyRole,
    session?.account.permissions,
  );
  const invoiceOpen = canOpenInvoiceSettings(
    session?.account.pharmacyRole,
    session?.account.permissions,
  );
  const distributorsOpen = canOpenDistributors(
    session?.account.pharmacyRole,
    session?.account.permissions,
  );
  const ownerPaths = new Set(["/users", "/support", "/profile"]);
  const managementPaths = new Set([
    "/employees",
    "/invoice-settings",
    "/users",
    "/profile",
    "/support",
  ]);
  let managementLabeled = false;
  const items = appRoutes
    .filter((route) => {
      if (route.path === "/employees") return employeesOpen;
      if (route.path === "/invoice-settings") return invoiceOpen;
      if (route.path === "/distributors") return distributorsOpen;
      return !ownerPaths.has(route.path) || owner;
    })
    .map((route) => {
      if (!managementPaths.has(route.path)) return route;
      if (managementLabeled) return { ...route, group: undefined };
      managementLabeled = true;
      return { ...route, group: "Management" };
    });
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
            .filter(
              (route) =>
                !ownerPaths.has(route.path) &&
                route.path !== "/employees" &&
                route.path !== "/invoice-settings" &&
                route.path !== "/distributors",
            )
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          <Route
            path="/distributors"
            element={distributorsOpen ? <DistributorsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/employees"
            element={employeesOpen ? <EmployeesPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/invoice-settings"
            element={invoiceOpen ? <InvoiceSettingsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/users"
            element={owner ? <UsersPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/support"
            element={owner ? <SupportPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/support/:caseId"
            element={owner ? <SupportPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/profile"
            element={owner ? <ProfilePage /> : <Navigate to="/dashboard" replace />}
          />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
