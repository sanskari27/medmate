import { createAsyncThunk } from "@reduxjs/toolkit";
import { ordersService } from "@/services/api/endpoints/orders";
import type { WriteRequest } from "@/services/api/write";

export const ordersWrite = createAsyncThunk("orders/write", (req: WriteRequest) =>
  ordersService(req),
);
