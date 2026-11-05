import { createAsyncThunk } from "@reduxjs/toolkit";
import { reportsService } from "@/services/api/endpoints/reports";
import type { WriteRequest } from "@/services/api/write";

export const reportsWrite = createAsyncThunk("reports/write", (req: WriteRequest) =>
  reportsService(req),
);
