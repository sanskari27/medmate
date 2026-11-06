import { createListenerMiddleware } from "@reduxjs/toolkit";
import { pathForRoute } from "@/app/routes";
import type { Route } from "@/types";
import { openReport, popRoute, pushRoute, resetRoute } from "@/store/actions/feedback.actions";
import { registerBack } from "@/store/navBack";

let navigate: (path: string, options?: { replace?: boolean }) => void = () => undefined;

export function bindRouter(next: typeof navigate) {
  navigate = next;
}

function scrollCanvas() {
  if (typeof document === "undefined") return;
  const canvas = document.querySelector(".!mx-auto !max-w-[1180px] !px-6 !py-5");
  if (canvas) canvas.scrollTop = 0;
}

type NavState = { ui: { nav: "push" | "replace" | "scroll" | "none"; route: Route } };

export const routerListener = createListenerMiddleware();

routerListener.startListening({
  actionCreator: pushRoute,
  effect: (action, api) => {
    registerBack(null);
    const nav = (api.getState() as NavState).ui.nav;
    if (nav === "push") navigate(pathForRoute[action.payload]);
    scrollCanvas();
  },
});

routerListener.startListening({
  actionCreator: popRoute,
  effect: (_action, api) => {
    const route = (api.getState() as NavState).ui.route;
    navigate(pathForRoute[route]);
    scrollCanvas();
  },
});

routerListener.startListening({
  actionCreator: resetRoute,
  effect: (action) => {
    registerBack(null);
    navigate(pathForRoute[action.payload], { replace: true });
    scrollCanvas();
  },
});

routerListener.startListening({
  actionCreator: openReport,
  effect: () => {
    navigate(pathForRoute.reports);
    scrollCanvas();
  },
});
