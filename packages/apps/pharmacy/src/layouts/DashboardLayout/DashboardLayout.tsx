import { PharmaProvider } from "@/store/slices/session";
import { Frame } from "./components/Frame";

export function DashboardLayout() {
  return (
    <PharmaProvider>
      <Frame />
    </PharmaProvider>
  );
}
