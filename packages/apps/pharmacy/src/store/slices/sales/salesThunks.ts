import { createAsyncThunk } from "@reduxjs/toolkit";
import { salesService } from "@/services/api/endpoints/sales";
import type { WriteRequest } from "@/services/api/write";

export const salesWrite = createAsyncThunk("sales/write", (req: WriteRequest) => salesService(req));
