import { createAsyncThunk } from "@reduxjs/toolkit";
import { prescriptionsService } from "@/services/api/endpoints/prescriptions";
import type { WriteRequest } from "@/services/api/write";

export const prescriptionsWrite = createAsyncThunk("prescriptions/write", (req: WriteRequest) =>
  prescriptionsService(req),
);
