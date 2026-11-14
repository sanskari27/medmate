import { combineReducers } from "@reduxjs/toolkit";
import { authApi, authReducer } from "@/features/authentication";
import { catalogApi } from "@/features/catalog";
import { leadsApi } from "@/features/leads";
import { pharmaciesApi } from "@/features/pharmacies";
import { prepApi } from "@/features/prep";
import { reviewsApi } from "@/features/reviews";
import { supportApi } from "@/features/support";

export const rootReducer = combineReducers({
  auth: authReducer,
  [authApi.reducerPath]: authApi.reducer,
  [reviewsApi.reducerPath]: reviewsApi.reducer,
  [pharmaciesApi.reducerPath]: pharmaciesApi.reducer,
  [supportApi.reducerPath]: supportApi.reducer,
  [leadsApi.reducerPath]: leadsApi.reducer,
  [catalogApi.reducerPath]: catalogApi.reducer,
  [prepApi.reducerPath]: prepApi.reducer,
});
