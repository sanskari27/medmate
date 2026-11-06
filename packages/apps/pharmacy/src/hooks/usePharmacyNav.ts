import { useCallback } from "react";
import type { Route } from "@/types";
import { openReport, popRoute, pushRoute, resetRoute } from "@/store/actions/feedback.actions";
import { consumeBack, registerBack } from "@/store/navBack";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";

export function usePharmacyNav() {
  const dispatch = useAppDispatch();
  const route = useAppSelector((state) => state.ui.route);
  const canGoBack = useAppSelector((state) => state.ui.canGoBack);
  const go = useCallback(
    (next: Route) => {
      dispatch(pushRoute(next));
    },
    [dispatch],
  );
  const back = useCallback(() => {
    if (consumeBack()) return;
    dispatch(popRoute());
  }, [dispatch]);
  const reset = useCallback(
    (next: Route) => {
      dispatch(resetRoute(next));
    },
    [dispatch],
  );
  const open = useCallback(
    (id: string) => {
      dispatch(openReport(id));
    },
    [dispatch],
  );
  return { route, canGoBack, go, back, reset, openReport: open, registerBack };
}
