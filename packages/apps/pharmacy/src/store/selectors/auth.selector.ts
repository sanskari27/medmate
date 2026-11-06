import type { Route } from "@/types";
import { routeLocked } from "@/utils";
import type { RootState } from "@/store";

export function selectIsHospital(state: RootState) {
  return state.auth.businessType === "hospital";
}

export function selectFeatureLocked(state: RootState, route: Route) {
  return routeLocked(route, state.auth.subscription, {
    grants: state.auth.grants,
    businessType: state.auth.businessType,
  });
}
