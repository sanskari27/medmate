import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Offer, OrderStatus, Sale } from "@/utils";
import { ONLINE_FLOW, packComplete } from "@/utils";
import type { SessionSnapshot } from "@/store/session";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { checkoutPos } from "@/store/thunks/billing.thunk";
import {
  advanceOrder,
  handToRider,
  markPaid,
  placeKioskOrder,
  sealPacket,
  startPacking,
} from "@/store/thunks/sales.thunk";

export type SalesState = {
  sales: Sale[];
  offers: Offer[];
  lastInvoice: Sale | null;
  loading: boolean;
  loaded: boolean;
  saving: boolean;
  error: string | null;
};

const initialState: SalesState = {
  sales: [],
  offers: [],
  lastInvoice: null,
  loading: false,
  loaded: false,
  saving: false,
  error: null,
};

function applySales(state: SalesState, session: SessionSnapshot) {
  state.sales = session.sales || [];
  state.offers = session.offers || [];
}

const salesSlice = createSlice({
  name: "sales",
  initialState,
  reducers: {
    setLastInvoice(state, action: PayloadAction<Sale | null>) {
      state.lastInvoice = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        if (!state.loaded) state.loading = true;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        applySales(state, action.payload);
        state.loading = false;
        state.loaded = true;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
      })
      .addCase(advanceOrder.fulfilled, (state, action) => {
        state.sales = state.sales.map((sale) => {
          if (sale.id !== action.payload || sale.channel !== "online") return sale;
          const index = ONLINE_FLOW.indexOf(sale.status as OrderStatus);
          if (index < 0 || index >= ONLINE_FLOW.length - 1) return sale;
          if (sale.status === "accepted" || sale.status === "packed") return sale;
          const next = ONLINE_FLOW[index + 1];
          const fulfillment =
            sale.status === "new" && !sale.fulfillment?.lines
              ? {
                  ...(sale.fulfillment ?? {}),
                  lines: sale.items.map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    qty: item.qty,
                    scanned: 0,
                  })),
                }
              : sale.fulfillment;
          return {
            ...sale,
            status: next,
            fulfillment,
            history: [...(sale.history ?? []), { status: next, at: Date.now() }],
          };
        });
      })
      .addCase(startPacking.fulfilled, (state, action) => {
        state.sales = state.sales.map((sale) => {
          if (sale.id !== action.payload || sale.channel !== "online" || sale.fulfillment?.lines)
            return sale;
          return {
            ...sale,
            fulfillment: {
              ...(sale.fulfillment ?? {}),
              lines: sale.items.map((item) => ({
                productId: item.productId,
                name: item.name,
                qty: item.qty,
                scanned: 0,
              })),
            },
          };
        });
      })
      .addCase(sealPacket.fulfilled, (state, action) => {
        state.sales = state.sales.map((sale) => {
          if (sale.id !== action.payload || !packComplete(sale)) return sale;
          return {
            ...sale,
            status: "packed" as OrderStatus,
            fulfillment: { ...sale.fulfillment, sealed: true, sealedAt: Date.now() },
            history: [
              ...(sale.history ?? []),
              {
                status: "packed" as OrderStatus,
                at: Date.now(),
                note: "Scanned, invoiced & sealed in a Namma MedMate packet",
              },
            ],
          };
        });
      })
      .addCase(handToRider.fulfilled, (state, action) => {
        state.sales = state.sales.map((sale) => {
          if (sale.id !== action.payload.id || sale.status !== "packed") return sale;
          const rider = action.payload.rider ?? sale.fulfillment?.rider;
          return {
            ...sale,
            status: "out" as OrderStatus,
            fulfillment: { ...(sale.fulfillment ?? {}), rider, handedAt: Date.now() },
            history: [
              ...(sale.history ?? []),
              {
                status: "out" as OrderStatus,
                at: Date.now(),
                note: rider?.name
                  ? `Handed to delivery partner ${rider.name}${rider.phone ? ` · ${rider.phone}` : ""}`
                  : "Handed to delivery partner",
              },
            ],
          };
        });
      })
      .addCase(markPaid.fulfilled, (state, action) => {
        state.sales = state.sales.map((sale) =>
          sale.id === action.payload.id
            ? {
                ...sale,
                paid: true,
                reception: false,
                payMode: action.payload.payMode,
                history: [
                  ...(sale.history ?? []),
                  { status: sale.status, at: Date.now(), note: "Payment received at reception" },
                ],
              }
            : sale,
        );
      })
      .addCase(checkoutPos.fulfilled, (state, action) => {
        const sale = action.payload.sale;
        state.sales = [sale, ...state.sales.filter((row) => row.id !== sale.id)];
        state.lastInvoice = sale;
      })
      .addCase(placeKioskOrder.fulfilled, (state, action) => {
        const sale = action.payload.sale;
        state.sales = [sale, ...state.sales.filter((row) => row.id !== sale.id)];
      })
      .addCase(signOutRequest.fulfilled, () => initialState)
      .addMatcher(
        (action) => action.type.startsWith("sales/") && action.type.endsWith("/pending"),
        (state) => {
          state.saving = true;
          state.error = null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("sales/") && action.type.endsWith("/rejected"),
        (state, action) => {
          state.saving = false;
          const payload = (action as { payload?: unknown }).payload;
          state.error = typeof payload === "string" ? payload : null;
        },
      )
      .addMatcher(
        (action) => action.type.startsWith("sales/") && action.type.endsWith("/fulfilled"),
        (state) => {
          state.saving = false;
        },
      );
  },
});

export const { setLastInvoice } = salesSlice.actions;
export default salesSlice.reducer;
