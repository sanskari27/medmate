import { createSlice } from "@reduxjs/toolkit";
import { openReport, setReportTarget } from "@/store/actions/feedback.actions";
import { signOutRequest } from "@/store/thunks/auth.thunk";

export type ReportsState = { reportTarget: string | null };

const initialState: ReportsState = { reportTarget: null };

const reportsSlice = createSlice({
  name: "reports",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(setReportTarget, (state, action) => {
        state.reportTarget = action.payload;
      })
      .addCase(openReport, (state, action) => {
        state.reportTarget = action.payload;
      })
      .addCase(signOutRequest.fulfilled, () => initialState);
  },
});

export default reportsSlice.reducer;
