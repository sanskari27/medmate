import { usePharma } from "@/app/session/pharmacy-provider";
import DashboardScreen from "@/features/dashboard/DashboardScreen";
import PosScreen from "@/features/pos/PosScreen";
import OrdersScreen from "@/features/orders/OrdersScreen";
import SalesScreen from "@/features/sales/SalesScreen";
import InventoryScreen from "@/features/inventory/InventoryScreen";
import RackMapScreen from "@/features/rackmap/RackMapScreen";
import PurchasesScreen from "@/features/purchasing/PurchasesScreen";
import ReorderScreen from "@/features/purchasing/ReorderScreen";
import DistributorsScreen from "@/features/purchasing/DistributorsScreen";
import PrescriptionsScreen from "@/features/prescriptions/PrescriptionsScreen";
import OnlineStoreScreen from "@/features/online/OnlineStoreScreen";
import OffersScreen from "@/features/offers/OffersScreen";
import KioskScreen from "@/features/kiosk/KioskScreen";
import ReportsScreen from "@/features/reports/ReportsScreen";
import CAReportScreen from "@/features/ca/CAReportScreen";
import CustomersScreen from "@/features/customers/CustomersScreen";
import AccountScreen from "@/features/account/AccountScreen";
import UsersScreen from "@/features/users/UsersScreen";
import InvoiceSettingsScreen from "@/features/invoicing/InvoiceSettingsScreen";
import SubscriptionScreen from "@/features/subscription/SubscriptionScreen";
import ReferScreen from "@/features/referrals/ReferScreen";
import SupportScreen from "@/features/support/SupportScreen";
import SettingsScreen from "@/features/settings/SettingsScreen";
import ExpensesScreen from "@/features/expenses/ExpensesScreen";
import EmployeesScreen from "@/features/employees/EmployeesScreen";
import KhataScreen from "@/features/khata/KhataScreen";
import CrmScreen from "@/features/crm/CrmScreen";
import WardsScreen from "@/features/hospital/wards/WardsScreen";
import IndentsScreen from "@/features/hospital/indents/IndentsScreen";
import DepartmentsScreen from "@/features/hospital/departments/DepartmentsScreen";
import SalesRegisterScreen from "@/features/hospital/sales-register/SalesRegisterScreen";
import PatientBillsScreen from "@/features/hospital/patient-bills/PatientBillsScreen";
import DoctorsScreen from "@/features/hospital/doctors/DoctorsScreen";
import HospitalBillingScreen from "@/features/hospital/billing/HospitalBillingScreen";

import { LockedFeature } from "./LockedFeature";

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
