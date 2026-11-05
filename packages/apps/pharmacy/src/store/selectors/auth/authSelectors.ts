import type { RootState } from "@/app/store/rootReducer";

export const selectSignedIn = (state: RootState) => state.auth.signedIn;
export const selectProfile = (state: RootState) => state.auth.profile;
