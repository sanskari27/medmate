import { createAsyncThunk } from "@reduxjs/toolkit";
import { billingService } from "@/services/api/endpoints/billing";
import type { WriteRequest } from "@/services/api/write";

export const billingWrite = createAsyncThunk("billing/write", (req: WriteRequest) =>
  billingService(req),
);
