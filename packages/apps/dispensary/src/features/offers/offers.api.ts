import { createApi } from "@reduxjs/toolkit/query/react";
import { apiClient } from "@/services/api";
import type { Offer, OfferPayload, OfferProduct } from "./model";

export const offersApi = createApi({
  reducerPath: "offersApi",
  baseQuery: apiClient,
  tagTypes: ["Offers"],
  endpoints: (build) => ({
    listOffers: build.query<{ offers: Offer[]; products: OfferProduct[] }, void>({
      query: () => ({ url: "/pharmacy/offers" }),
      providesTags: ["Offers"],
    }),
    createOffer: build.mutation<{ offer: Offer }, OfferPayload>({
      query: (body) => ({ url: "/pharmacy/offers", method: "POST", body }),
      invalidatesTags: ["Offers"],
    }),
    updateOffer: build.mutation<
      { offer: Offer },
      { id: string; body: Partial<OfferPayload> & { active?: boolean } }
    >({
      query: ({ id, body }) => ({
        url: `/pharmacy/offers/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Offers"],
    }),
    deleteOffer: build.mutation<void, string>({
      query: (id) => ({
        url: `/pharmacy/offers/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Offers"],
    }),
  }),
});

export const {
  useListOffersQuery,
  useCreateOfferMutation,
  useUpdateOfferMutation,
  useDeleteOfferMutation,
} = offersApi;
