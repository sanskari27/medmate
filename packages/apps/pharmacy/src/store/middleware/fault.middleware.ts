import { createListenerMiddleware, isFulfilled, isRejectedWithValue } from "@reduxjs/toolkit";
import { clearFormFault, setFormFault } from "@/store/actions/feedback.actions";
import { faultOf } from "@/utils/validation";

export const faultListener = createListenerMiddleware();

faultListener.startListening({
  matcher: isRejectedWithValue,
  effect: (action, api) => {
    if (typeof action.payload !== "string" || action.payload === "UNAUTHORIZED") return;
    api.dispatch(setFormFault(faultOf(new Error(action.payload))));
  },
});

faultListener.startListening({
  matcher: isFulfilled,
  effect: (action, api) => {
    if (String(action.type).startsWith("auth/loadSession")) return;
    api.dispatch(clearFormFault());
  },
});
