import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { signOutRequest } from "@/store/thunks/auth.thunk";

export type OrdersState = { focusId: string | null };

const initialState: OrdersState = { focusId: null };

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setFocusId(state, action: PayloadAction<string | null>) {
      state.focusId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(signOutRequest.fulfilled, () => initialState);
  },
});

export const { setFocusId } = ordersSlice.actions;
export default ordersSlice.reducer;
