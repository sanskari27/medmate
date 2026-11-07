import { createAsyncThunk } from "@/store/createAsyncThunk";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { salesService } from "@/services/api/endpoints/sales";
import type { InvProduct, Offer, PayMode, Rider, Sale } from "@/utils";
import { PAY_LABEL } from "@/utils";
import { showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = {
  auth: { signedIn: boolean };
  sales: { sales: Sale[] };
  inventory: { inventory: InvProduct[] };
};
type Dispatch = ThunkDispatch<Gate, unknown, Action>;

function reload(dispatch: Dispatch) {
  return () => dispatch(loadSession()).unwrap();
}

export const advanceOrder = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "sales/advanceOrder",
  async (id, { dispatch, getState, rejectWithValue }) => {
    const sale = getState().sales.sales.find((row) => row.id === id);
    const result = await write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not advance the order",
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await salesService.advanceOrder(id);
        return id;
      },
    });
    if (typeof result === "string" && sale?.status === "out")
      dispatch(showToast(sale.id + " marked delivered"));
    else if (typeof result === "string" && sale?.status === "new")
      dispatch(showToast(sale.id + " accepted"));
    return result;
  },
);

export const cancelOrder = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "sales/cancelOrder",
  async (id, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not cancel the order",
      pull: true,
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await salesService.cancelOrder(id);
        return id;
      },
    }),
);

export const startPacking = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "sales/startPacking",
  async (id, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not start packing",
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await salesService.startPacking(id);
        return id;
      },
    }),
);

export const scanPackLine = createAsyncThunk<
  { name: string; batchNo: string; scanned: number; qty: number },
  { id: string; code: string },
  { state: Gate; rejectValue: string }
>("sales/scanPackLine", async ({ id, code }, { dispatch, getState, rejectWithValue }) => {
  const trimmed = code.trim();
  if (!trimmed) return rejectWithValue("Scan a barcode");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not scan the item",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: () => salesService.scanPackLine(id, trimmed),
  });
});

export const pickPackLine = createAsyncThunk<
  { id: string; productId: string; delta: number },
  { id: string; productId: string; delta: number },
  { state: Gate; rejectValue: string }
>("sales/pickPackLine", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not pick the item",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await salesService.pickPackLine(body.id, body.productId, body.delta);
      return body;
    },
  }),
);

export const sealPacket = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "sales/sealPacket",
  async (id, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not seal the packet",
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await salesService.sealPacket(id);
        dispatch(showToast(id + " sealed"));
        return id;
      },
    }),
);

export const handToRider = createAsyncThunk<
  { id: string; rider?: Rider },
  { id: string; rider?: Rider },
  { state: Gate; rejectValue: string }
>("sales/handToRider", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not hand over the order",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await salesService.handToRider(body.id, body.rider);
      dispatch(showToast(body.id + " handed over"));
      return body;
    },
  }),
);

export const markPaid = createAsyncThunk<
  { id: string; payMode: PayMode },
  { id: string; payMode: PayMode },
  { state: Gate; rejectValue: string }
>("sales/markPaid", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not record the payment",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await salesService.markPaid(body.id, body.payMode);
      dispatch(showToast("Payment recorded for " + body.id + " · " + PAY_LABEL[body.payMode]));
      return body;
    },
  }),
);

export const addOffer = createAsyncThunk<Offer, Offer, { state: Gate; rejectValue: string }>(
  "sales/addOffer",
  async (offer, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not save the offer",
      pull: true,
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await salesService.addOffer(offer);
        dispatch(showToast(offer.title + " launched"));
        return offer;
      },
    }),
);

export const toggleOffer = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "sales/toggleOffer",
  async (id, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not update the offer",
      pull: true,
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await salesService.toggleOffer(id);
        return id;
      },
    }),
);

export const settleBills = createAsyncThunk<
  { ids: string[]; payMode: PayMode },
  { ids: string[]; payMode: PayMode },
  { state: Gate; rejectValue: string }
>("sales/settleBills", async (body, { dispatch, getState, rejectWithValue }) => {
  if (body.ids.length === 0) return body;
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not settle the bills",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await salesService.settleBills(body.ids, body.payMode);
      dispatch(
        showToast(
          `Settled ${body.ids.length} bill${body.ids.length === 1 ? "" : "s"} · ${PAY_LABEL[body.payMode]}`,
        ),
      );
      return body;
    },
  });
});

export const placeKioskOrder = createAsyncThunk<
  { sale: Sale; inventory: InvProduct[] },
  { lines: { productId: string; qty: number; loose?: boolean }[]; payMode: PayMode },
  { state: Gate; rejectValue: string }
>("sales/placeKioskOrder", async (body, { dispatch, getState, rejectWithValue }) => {
  if (!body.lines.length) return rejectWithValue("Nothing to order");
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Order failed",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      const result = await salesService.placeKioskOrder(body.lines, body.payMode);
      dispatch(showToast("Kiosk order " + result.sale.id + " sent to counter"));
      return result;
    },
  });
});
