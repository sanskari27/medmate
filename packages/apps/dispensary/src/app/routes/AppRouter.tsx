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
import { InventoryPage, canOpenInventory } from "@/features/inventory";
import { OffersPage, canOpenOffers } from "@/features/offers";
import { PurchasesPage, canOpenPurchases } from "@/features/purchases";
import { RacksPage, canOpenRacks } from "@/features/racks";
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
  const purchasesOpen = canOpenPurchases(
    session?.account.pharmacyRole,
    session?.account.permissions,
  );
  const inventoryOpen = canOpenInventory(
    session?.account.pharmacyRole,
    session?.account.permissions,
  );
  const racksOpen = canOpenRacks(session?.account.pharmacyRole, session?.account.permissions);
  const offersOpen = canOpenOffers(session?.account.pharmacyRole, session?.account.permissions);
  const ownerPaths = new Set(["/users", "/support", "/profile"]);
  const managementPaths = new Set([
    "/employees",
    "/invoice-settings",
    "/users",
    "/profile",
    "/support",
  ]);
  const cataloguePaths = new Set([
    "/distributors",
    "/purchases",
    "/inventory",
    "/racks",
    "/offers",
  ]);
  let catalogueLabeled = false;
  let managementLabeled = false;
  const items = appRoutes
    .filter((route) => {
      if (route.path === "/employees") return employeesOpen;
      if (route.path === "/invoice-settings") return invoiceOpen;
      if (route.path === "/distributors") return distributorsOpen;
      if (route.path === "/purchases") return purchasesOpen;
      if (route.path === "/inventory") return inventoryOpen;
      if (route.path === "/racks") return racksOpen;
      if (route.path === "/offers") return offersOpen;
      return !ownerPaths.has(route.path) || owner;
    })
    .map((route) => {
      let next = route;
      if (cataloguePaths.has(route.path)) {
        next = catalogueLabeled ? { ...route, group: undefined } : { ...route, group: "Catalogue" };
        catalogueLabeled = true;
      }
      if (!managementPaths.has(route.path)) return next;
      if (managementLabeled) return { ...next, group: undefined };
      managementLabeled = true;
      return { ...next, group: "Management" };
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
                route.path !== "/distributors" &&
                route.path !== "/purchases" &&
                route.path !== "/inventory" &&
                route.path !== "/racks" &&
                route.path !== "/offers",
            )
            .map((route) => (
              <Route key={route.path} path={route.path} element={route.element} />
            ))}
          <Route
            path="/distributors"
            element={distributorsOpen ? <DistributorsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/purchases"
            element={purchasesOpen ? <PurchasesPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/purchases/:id"
            element={purchasesOpen ? <PurchasesPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/inventory"
            element={inventoryOpen ? <InventoryPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/racks"
            element={racksOpen ? <RacksPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/offers"
            element={offersOpen ? <OffersPage /> : <Navigate to="/dashboard" replace />}
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
