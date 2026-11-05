import { Stack } from "@/components/atoms";
import { Toast } from "@/components/organisms/Toast";
import { usePharma } from "@/hooks";
import { FaultBanner } from "../FaultBanner";
import { Inner } from "../Inner";
import { SupportBanner } from "../SupportBanner";

export function Frame() {
  const { formFault } = usePharma();
  return (
    <Stack className="contents" data-slot="app-frame" data-fault={formFault?.field || ""}>
      <SupportBanner />
      <Inner />
      <FaultBanner />
      <Toast />
    </Stack>
  );
}
