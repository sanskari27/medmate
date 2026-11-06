import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Action, ThunkDispatch } from "@reduxjs/toolkit";
import { inventoryService } from "@/services/api/endpoints/inventory";
import type { InvProduct, OfferType } from "@/utils";
import { normalizeRack } from "@/utils";
import { showToast } from "@/store/actions/feedback.actions";
import { loadSession } from "@/store/thunks/auth.thunk";
import { write } from "@/store/write";

type Gate = { auth: { signedIn: boolean }; inventory: { racks: string[] } };
type Dispatch = ThunkDispatch<Gate, unknown, Action>;

function reload(dispatch: Dispatch) {
  return () => dispatch(loadSession()).unwrap();
}

export const addProduct = createAsyncThunk<
  InvProduct,
  InvProduct,
  { state: Gate; rejectValue: string }
>("inventory/addProduct", async (product, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the product",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.addProduct(product);
      return product;
    },
  }),
);

export const importMedicines = createAsyncThunk<
  { added: number; skipped: string[] },
  InvProduct[],
  { state: Gate; rejectValue: string }
>("inventory/importMedicines", async (products, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not import medicines",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      const result = await inventoryService.importMedicines(products);
      dispatch(
        showToast(
          result.added
            ? `Imported ${result.added} medicine${result.added === 1 ? "" : "s"}`
            : "Those medicines are already in the catalogue",
        ),
      );
      return result;
    },
  }),
);

export const updateProduct = createAsyncThunk<
  { id: string; patch: Partial<InvProduct> },
  { id: string; patch: Partial<InvProduct> },
  { state: Gate; rejectValue: string }
>("inventory/updateProduct", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the product",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.updateProduct(body.id, body.patch);
      return body;
    },
  }),
);

export const setProductLocation = createAsyncThunk<
  { id: string; rack: string; rackAlt?: string },
  { id: string; rack: string; rackAlt?: string },
  { state: Gate; rejectValue: string }
>("inventory/setProductLocation", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not set the location",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setProductLocation(body.id, body.rack, body.rackAlt);
      return body;
    },
  }),
);

export const bulkAssignLocation = createAsyncThunk<
  { ids: string[]; rack: string },
  { ids: string[]; rack: string },
  { state: Gate; rejectValue: string }
>("inventory/bulkAssignLocation", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not assign the location",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.bulkAssignLocation(body.ids, body.rack);
      return body;
    },
  }),
);

export const createRack = createAsyncThunk<
  "added" | "exists",
  string,
  { state: Gate; rejectValue: string }
>("inventory/createRack", async (rack, { dispatch, getState, rejectWithValue }) => {
  const code = normalizeRack(rack);
  if (!code) return rejectWithValue("Rack code is required");
  if (getState().inventory.racks.includes(code)) return "exists";
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the rack",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.createRack(code);
      return "added" as const;
    },
  });
});

export const addBatch = createAsyncThunk<
  { id: string; batch: InvProduct["batches"][number] },
  { id: string; batch: InvProduct["batches"][number] },
  { state: Gate; rejectValue: string }
>("inventory/addBatch", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not add the batch",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.addBatch(body.id, body.batch);
      return body;
    },
  }),
);

export const setBatchQty = createAsyncThunk<
  { id: string; batchNo: string; qty: number },
  { id: string; batchNo: string; qty: number },
  { state: Gate; rejectValue: string }
>("inventory/setBatchQty", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the batch",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setBatchQty(body.id, body.batchNo, body.qty);
      return body;
    },
  }),
);

export const toggleOnline = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "inventory/toggleOnline",
  async (id, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not update online selling",
      pull: true,
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await inventoryService.toggleOnline(id);
        return id;
      },
    }),
);

export const toggleLoose = createAsyncThunk<string, string, { state: Gate; rejectValue: string }>(
  "inventory/toggleLoose",
  async (id, { dispatch, getState, rejectWithValue }) =>
    write({
      signedIn: getState().auth.signedIn,
      fallback: "Could not update loose selling",
      pull: true,
      reload: reload(dispatch),
      rejectWithValue,
      work: async () => {
        await inventoryService.toggleLoose(id);
        return id;
      },
    }),
);

export const setOnlinePrice = createAsyncThunk<
  { id: string; price: number | undefined },
  { id: string; price: number | undefined },
  { state: Gate; rejectValue: string }
>("inventory/setOnlinePrice", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the online price",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setOnlinePrice(body.id, body.price);
      return body;
    },
  }),
);

export const setProductOffer = createAsyncThunk<
  { id: string; offerId: string | undefined },
  { id: string; offerId: string | undefined },
  { state: Gate; rejectValue: string }
>("inventory/setProductOffer", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the offer",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setProductOffer(body.id, body.offerId);
      return body;
    },
  }),
);

export const setDirectOffer = createAsyncThunk<
  { productId: string; type: OfferType; value: number },
  { productId: string; type: OfferType; value: number },
  { state: Gate; rejectValue: string }
>("inventory/setDirectOffer", async (body, { dispatch, getState, rejectWithValue }) => {
  if (!body.value || body.value <= 0) {
    dispatch(showToast("Records cannot be deleted"));
    return rejectWithValue("Records cannot be deleted");
  }
  return write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not save the offer",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setDirectOffer(body.productId, body.type, body.value);
      return body;
    },
  });
});

export const setLooseDefault = createAsyncThunk<
  boolean,
  boolean,
  { state: Gate; rejectValue: string }
>("inventory/setLooseDefault", async (allowed, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update loose selling",
    pull: true,
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setLooseDefault(allowed);
      return allowed;
    },
  }),
);

export const setProductSupplier = createAsyncThunk<
  { id: string; supplierId: string },
  { id: string; supplierId: string },
  { state: Gate; rejectValue: string }
>("inventory/setProductSupplier", async (body, { dispatch, getState, rejectWithValue }) =>
  write({
    signedIn: getState().auth.signedIn,
    fallback: "Could not update the supplier",
    reload: reload(dispatch),
    rejectWithValue,
    work: async () => {
      await inventoryService.setProductSupplier(body.id, body.supplierId);
      return body;
    },
  }),
);
