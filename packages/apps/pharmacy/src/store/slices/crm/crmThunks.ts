import { createAsyncThunk } from "@reduxjs/toolkit";
import { crmService } from "@/services/api/endpoints/crm";
import type { WriteRequest } from "@/services/api/write";

export const crmWrite = createAsyncThunk("crm/write", (req: WriteRequest) => crmService(req));
