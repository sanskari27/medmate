import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { faultListener } from "@/store/middleware/fault.middleware";
import { routerListener } from "@/store/middleware/router.middleware";
import { setPricingFlag } from "@/store/pricingFlag";
import authReducer from "@/store/slices/auth.slice";
import billingReducer from "@/store/slices/billing.slice";
import crmReducer from "@/store/slices/crm.slice";
import customersReducer from "@/store/slices/customers.slice";
import hospitalReducer from "@/store/slices/hospital.slice";
import inventoryReducer from "@/store/slices/inventory.slice";
import masterReducer from "@/store/slices/master.slice";
import ordersReducer from "@/store/slices/orders.slice";
import prescriptionsReducer from "@/store/slices/prescriptions.slice";
import purchasesReducer from "@/store/slices/purchases.slice";
import reportsReducer from "@/store/slices/reports.slice";
import salesReducer from "@/store/slices/sales.slice";
import uiReducer from "@/store/slices/ui.slice";

export const rootReducer = combineReducers({
  auth: authReducer,
  billing: billingReducer,
  crm: crmReducer,
  customers: customersReducer,
  hospital: hospitalReducer,
  inventory: inventoryReducer,
  master: masterReducer,
  orders: ordersReducer,
  prescriptions: prescriptionsReducer,
  purchases: purchasesReducer,
  reports: reportsReducer,
  sales: salesReducer,
  ui: uiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(faultListener.middleware, routerListener.middleware),
});

store.subscribe(() => {
  setPricingFlag(store.getState().ui.pricingUnlocked);
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
