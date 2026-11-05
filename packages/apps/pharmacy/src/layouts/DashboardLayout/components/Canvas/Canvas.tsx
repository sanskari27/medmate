import { usePharma } from "@/hooks";
import DashboardScreen from "@/screens/Dashboard";
import PosScreen from "@/screens/Billing";
import OrdersScreen from "@/screens/Orders";
import SalesScreen from "@/screens/Sales";
import InventoryScreen from "@/screens/Inventory";
import RackMapScreen from "@/screens/RackMap";
import PurchasesScreen from "@/screens/Purchases";
import ReorderScreen from "@/screens/Reorder";
import DistributorsScreen from "@/screens/Suppliers";
import PrescriptionsScreen from "@/screens/Prescriptions";
import OnlineStoreScreen from "@/screens/OnlineStore";
import OffersScreen from "@/screens/Offers";
import KioskScreen from "@/screens/Kiosk";
import ReportsScreen from "@/screens/Reports";
import CAReportScreen from "@/screens/CharteredAccountant";
import CustomersScreen from "@/screens/Customers";
import AccountScreen from "@/screens/Account";
import UsersScreen from "@/screens/Users";
import InvoiceSettingsScreen from "@/screens/InvoiceSettings";
import SubscriptionScreen from "@/screens/Subscription";
import ReferScreen from "@/screens/Referrals";
import SupportScreen from "@/screens/Support";
import SettingsScreen from "@/screens/Settings";
import ExpensesScreen from "@/screens/Expenses";
import EmployeesScreen from "@/screens/Employees";
import KhataScreen from "@/screens/Khata";
import CrmScreen from "@/screens/Crm";
import WardsScreen from "@/screens/Wards";
import IndentsScreen from "@/screens/Indents";
import DepartmentsScreen from "@/screens/Departments";
import SalesRegisterScreen from "@/screens/SalesRegister";
import PatientBillsScreen from "@/screens/PatientBills";
import DoctorsScreen from "@/screens/Doctors";
import HospitalBillingScreen from "@/screens/HospitalBilling";

import { LockedFeature } from "@/layouts/DashboardLayout/components/LockedFeature";

export function Canvas() {
  const { route, featureLocked } = usePharma();
  if (featureLocked(route)) return <LockedFeature route={route} />;
  switch (route) {
    case "pos":
      return <PosScreen />;
    case "orders":
      return <OrdersScreen />;
    case "sales":
      return <SalesScreen />;
    case "inventory":
      return <InventoryScreen />;
    case "rackmap":
      return <RackMapScreen />;
    case "purchases":
      return <PurchasesScreen />;
    case "reorder":
      return <ReorderScreen />;
    case "distributors":
      return <DistributorsScreen />;
    case "prescriptions":
      return <PrescriptionsScreen />;
    case "customers":
      return <CustomersScreen />;
    case "khata":
      return <KhataScreen />;
    case "crm":
      return <CrmScreen />;
    case "wards":
      return <WardsScreen />;
    case "hospbill":
      return <HospitalBillingScreen />;
    case "ptbills":
      return <PatientBillsScreen />;
    case "salesreg":
      return <SalesRegisterScreen />;
    case "indents":
      return <IndentsScreen />;
    case "departments":
      return <DepartmentsScreen />;
    case "doctors":
      return <DoctorsScreen />;
    case "online":
      return <OnlineStoreScreen />;
    case "offers":
      return <OffersScreen />;
    case "kiosk":
      return <KioskScreen />;
    case "reports":
      return <ReportsScreen />;
    case "expenses":
      return <ExpensesScreen />;
    case "ca":
      return <CAReportScreen />;
    case "account":
      return <AccountScreen />;
    case "employees":
      return <EmployeesScreen />;
    case "users":
      return <UsersScreen />;
    case "invoicing":
      return <InvoiceSettingsScreen />;
    case "subscription":
      return <SubscriptionScreen />;
    case "refer":
      return <ReferScreen />;
    case "support":
      return <SupportScreen />;
    case "settings":
      return <SettingsScreen />;
    default:
      return <DashboardScreen />;
  }
}
