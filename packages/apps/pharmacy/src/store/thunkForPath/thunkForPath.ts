import { authWrite } from "@/store/slices/auth";
import { billingWrite } from "@/store/slices/billing";
import { crmWrite } from "@/store/slices/crm";
import { customersWrite } from "@/store/slices/customers";
import { hospitalWrite } from "@/store/slices/hospital";
import { inventoryWrite } from "@/store/slices/inventory";
import { ordersWrite } from "@/store/slices/orders";
import { prescriptionsWrite } from "@/store/slices/prescriptions";
import { purchasesWrite } from "@/store/slices/purchases";
import { reportsWrite } from "@/store/slices/reports";
import { salesWrite } from "@/store/slices/sales";
import { uiWrite } from "@/store/slices/ui";

const writers = {
  auth: authWrite,
  billing: billingWrite,
  crm: crmWrite,
  customers: customersWrite,
  hospital: hospitalWrite,
  inventory: inventoryWrite,
  orders: ordersWrite,
  prescriptions: prescriptionsWrite,
  purchases: purchasesWrite,
  reports: reportsWrite,
  sales: salesWrite,
  ui: uiWrite,
};

export function thunkForPath(path: string) {
  if (path.startsWith("/inventory") || path.startsWith("/racks")) return writers.inventory;
  if (
    path.startsWith("/purchases") ||
    path.startsWith("/purchase-orders") ||
    path.startsWith("/suppliers") ||
    path.startsWith("/supply-list") ||
    path.startsWith("/expenses") ||
    path.startsWith("/expense-categories")
  ) {
    return writers.purchases;
  }
  if (path.startsWith("/hospital")) return writers.hospital;
  if (path.startsWith("/crm")) return writers.crm;
  if (path.startsWith("/sales")) return writers.orders;
  if (path.startsWith("/offers")) return writers.sales;
  if (path.startsWith("/credit") || path.startsWith("/referrals")) return writers.customers;
  if (path.startsWith("/prescriptions")) return writers.prescriptions;
  if (path.startsWith("/reports") || path.startsWith("/ca")) return writers.reports;
  if (path.startsWith("/support")) return writers.ui;
  if (path.startsWith("/pos")) return writers.billing;
  return writers.auth;
}
