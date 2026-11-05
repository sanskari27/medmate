import { AppProviders } from "./providers";
import { DashboardLayout } from "@/layouts/DashboardLayout";

export function App() {
  return (
    <AppProviders>
      <DashboardLayout />
    </AppProviders>
  );
}
