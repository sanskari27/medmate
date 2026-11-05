import { usePharma } from "@/app/session/pharmacy-provider";

import { Toast } from "./Toast";
import { FaultBanner } from "./FaultBanner";
import { Inner } from "./Inner";
import { SupportBanner } from "./SupportBanner";

export function Frame() {
  const { formFault } = usePharma();
  return (
    <div className="pd-app" data-fault={formFault?.field || ""}>
      <SupportBanner />
      <Inner />
      <FaultBanner />
      <Toast />
    </div>
  );
}
