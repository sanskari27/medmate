import type { SaveFault } from "@/utils";
import type { Route } from "@/types";
import { routeFromPath } from "@/app/routes";
import { createFieldSlice } from "@/app/store/createFieldSlice";

export type Ticket = {
  id: string;
  subject: string;
  category: string;
  status: "Open" | "Resolved";
  createdAt: number;
};

export type UiState = {
  leaveOpen: boolean;
  route: Route;
  canGoBack: boolean;
  invFilter: string | null;
  toastMsg: string | null;
  formFault: SaveFault | null;
  billIndentTarget: string | null;
  pricingUnlocked: boolean;
  tickets: Ticket[];
};

function initialRoute(): Route {
  if (typeof window === "undefined") return "dashboard";
  return routeFromPath(window.location.pathname);
}

const uiSlice = createFieldSlice<UiState>("ui", {
  leaveOpen: false,
  route: initialRoute(),
  canGoBack: false,
  invFilter: null,
  toastMsg: null,
  formFault: null,
  billIndentTarget: null,
  pricingUnlocked: false,
  tickets: [],
});

export const setUiField = uiSlice.actions.setField;
export const uiReducer = uiSlice.reducer;
