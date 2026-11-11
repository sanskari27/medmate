import { combineReducers } from "@reduxjs/toolkit";
import { authApi, authReducer } from "@/features/authentication";
import { setupApi } from "@/features/setup";

export const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [setupApi.reducerPath]: setupApi.reducer,
});
