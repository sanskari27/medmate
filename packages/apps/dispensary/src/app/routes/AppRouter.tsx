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
import { ExpensesPage, canOpenExpenses } from "@/features/expenses";
import { ReportPage, ReportsPage, canOpenReports } from "@/features/reports";
import { BillingPage, canOpenBilling } from "@/features/billing";
import { SalesPage, canOpenSales } from "@/features/sales";
import { PatientsPage, canOpenPatients } from "@/features/patients";
import { DoctorsPage, canOpenDoctors } from "@/features/doctors";
import { DepartmentsPage, canOpenDepartments } from "@/features/departments";
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
  const expensesOpen = canOpenExpenses(session?.account.pharmacyRole, session?.account.permissions);
  const reportsOpen = canOpenReports(session?.account.pharmacyRole, session?.account.permissions);
  const billingOpen = canOpenBilling(session?.account.pharmacyRole, session?.account.permissions);
  const salesOpen = canOpenSales(session?.account.pharmacyRole, session?.account.permissions);
  const patientsOpen = canOpenPatients(session?.account.pharmacyRole, session?.account.permissions);
  const doctorsOpen = canOpenDoctors(
    session?.account.pharmacyRole,
    session?.account.permissions,
    session?.account.pharmacyType,
  );
  const departmentsOpen = canOpenDepartments(
    session?.account.pharmacyRole,
    session?.account.permissions,
    session?.account.pharmacyType,
  );
  const ownerPaths = new Set(["/users", "/support", "/profile"]);
  const managementPaths = new Set([
    "/employees",
    "/invoice-settings",
    "/users",
    "/profile",
    "/support",
  ]);
  const counterPaths = new Set(["/billing", "/sales", "/patients"]);
  let counterLabeled = false;
  const hospitalPaths = new Set(["/doctors", "/departments"]);
  let hospitalLabeled = false;
  const cataloguePaths = new Set([
    "/distributors",
    "/purchases",
    "/inventory",
    "/racks",
    "/offers",
  ]);
  let catalogueLabeled = false;
  const businessPaths = new Set(["/expenses", "/reports"]);
  let businessLabeled = false;
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
      if (route.path === "/expenses") return expensesOpen;
      if (route.path === "/reports") return reportsOpen;
      if (route.path === "/billing") return billingOpen;
      if (route.path === "/sales") return salesOpen;
      if (route.path === "/patients") return patientsOpen;
      if (route.path === "/doctors") return doctorsOpen;
      if (route.path === "/departments") return departmentsOpen;
      return !ownerPaths.has(route.path) || owner;
    })
    .map((route) => {
      let next = route;
      if (counterPaths.has(route.path)) {
        next = counterLabeled ? { ...route, group: undefined } : { ...route, group: "Counter" };
        counterLabeled = true;
      }
      if (hospitalPaths.has(route.path)) {
        next = hospitalLabeled ? { ...route, group: undefined } : { ...next, group: "Hospital" };
        hospitalLabeled = true;
      }
      if (cataloguePaths.has(route.path)) {
        next = catalogueLabeled ? { ...route, group: undefined } : { ...route, group: "Catalogue" };
        catalogueLabeled = true;
      }
      if (businessPaths.has(route.path)) {
        next = businessLabeled ? { ...route, group: undefined } : { ...route, group: "Business" };
        businessLabeled = true;
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
                route.path !== "/offers" &&
                route.path !== "/expenses" &&
                route.path !== "/reports" &&
                route.path !== "/billing" &&
                route.path !== "/sales" &&
                route.path !== "/patients" &&
                route.path !== "/doctors" &&
                route.path !== "/departments",
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
            path="/billing"
            element={billingOpen ? <BillingPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/sales"
            element={salesOpen ? <SalesPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/sales/:id"
            element={salesOpen ? <SalesPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/patients"
            element={patientsOpen ? <PatientsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/doctors"
            element={doctorsOpen ? <DoctorsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/departments"
            element={departmentsOpen ? <DepartmentsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/offers"
            element={offersOpen ? <OffersPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/expenses"
            element={expensesOpen ? <ExpensesPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reports"
            element={reportsOpen ? <ReportsPage /> : <Navigate to="/dashboard" replace />}
          />
          <Route
            path="/reports/:reportId"
            element={reportsOpen ? <ReportPage /> : <Navigate to="/dashboard" replace />}
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
