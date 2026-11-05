import { createAsyncThunk } from "@reduxjs/toolkit";
import { uiService } from "@/services/api/endpoints/ui";
import type { WriteRequest } from "@/services/api/write";

export const uiWrite = createAsyncThunk("ui/write", (req: WriteRequest) => uiService(req));
