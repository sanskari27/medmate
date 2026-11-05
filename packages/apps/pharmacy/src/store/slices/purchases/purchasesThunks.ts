import { createAsyncThunk } from "@reduxjs/toolkit";
import { purchasesService } from "@/services/api/endpoints/purchases";
import type { WriteRequest } from "@/services/api/write";

export const purchasesWrite = createAsyncThunk("purchases/write", (req: WriteRequest) =>
  purchasesService(req),
);
