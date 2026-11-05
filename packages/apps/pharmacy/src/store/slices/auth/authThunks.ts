import { createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "@/services/api/apiClient";
import { authService } from "@/services/api/endpoints/auth";
import type { WriteRequest } from "@/services/api/write";
import type { BusinessType } from "@/types";

let boot: Promise<unknown> | null = null;

export const loadSession = createAsyncThunk("auth/loadSession", async () => {
  if (!boot) {
    boot = api("/session").finally(() => {
      boot = null;
    });
  }
  return boot;
});

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (body: {
    phone: string;
    code: string;
    businessType: BusinessType;
    name?: string;
    purpose?: "reset";
  }) => {
    await api("/auth/otp/verify", { method: "POST", body });
  },
);

export const pinSignIn = createAsyncThunk(
  "auth/pinSignIn",
  async (body: { phone: string; pin: string }) => {
    await api("/auth/pin", { method: "POST", body });
  },
);

export const saveLoginPin = createAsyncThunk(
  "auth/saveLoginPin",
  async (body: { pin: string; confirm: string }) => {
    await api("/auth/pin/set", { method: "POST", body });
  },
);

export const signOutRequest = createAsyncThunk("auth/signOut", async () => {
  await api("/auth/sign-out", { method: "POST" });
});

export const authWrite = createAsyncThunk("auth/write", (req: WriteRequest) => authService(req));
