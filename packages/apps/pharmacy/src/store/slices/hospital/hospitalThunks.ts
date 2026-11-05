import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/api/apiClient";
import { hospitalService } from "@/services/api/endpoints/hospital";
import type { WriteRequest } from "@/services/api/write";

export const hospitalWrite = createAsyncThunk("hospital/write", (req: WriteRequest) =>
  hospitalService(req),
);

export const unlockPricingRequest = createAsyncThunk(
  "hospital/unlockPricing",
  async (otp: string) => {
    await api("/hospital/pricing/unlock", { method: "POST", body: { code: otp } });
  },
);
