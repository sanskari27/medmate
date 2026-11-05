import { usePharma } from "@/store/slices/session";

import { Toast } from "@/layouts/DashboardLayout/components/Toast";
import { FaultBanner } from "@/layouts/DashboardLayout/components/FaultBanner";
import { Inner } from "@/layouts/DashboardLayout/components/Inner";
import { SupportBanner } from "@/layouts/DashboardLayout/components/SupportBanner";

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
