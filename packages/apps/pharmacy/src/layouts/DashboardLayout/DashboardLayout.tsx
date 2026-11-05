import { PharmaProvider } from "@/app/providers/PharmaProvider";
import { Frame } from "./components/Frame";

export function DashboardLayout() {
  return (
    <PharmaProvider>
      <Frame />
    </PharmaProvider>
  );
}
