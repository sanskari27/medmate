import { createAction } from "@reduxjs/toolkit";
import type { InvoiceSettings, KioskConfig } from "@/utils";

export const patchInvoiceSettings = createAction<InvoiceSettings>("auth/patchInvoiceSettings");
export const patchKiosk = createAction<KioskConfig>("auth/patchKiosk");
export const setHoldSetup = createAction<boolean>("auth/setHoldSetup");
export const setPinFlags = createAction<{ pinReset?: boolean; needsPin?: boolean }>(
  "auth/setPinFlags",
);
