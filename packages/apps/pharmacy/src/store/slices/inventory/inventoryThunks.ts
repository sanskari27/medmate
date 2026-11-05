import { createAsyncThunk } from "@reduxjs/toolkit";
import { inventoryService } from "@/services/api/endpoints/inventory";
import type { WriteRequest } from "@/services/api/write";

export const inventoryWrite = createAsyncThunk("inventory/write", (req: WriteRequest) =>
  inventoryService(req),
);
