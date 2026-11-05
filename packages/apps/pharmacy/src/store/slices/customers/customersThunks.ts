import { createAsyncThunk } from "@reduxjs/toolkit";
import { customersService } from "@/services/api/endpoints/customers";
import type { WriteRequest } from "@/services/api/write";

export const customersWrite = createAsyncThunk("customers/write", (req: WriteRequest) =>
  customersService(req),
);
