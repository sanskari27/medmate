import { Outlet } from "react-router-dom";
import { ScrollToTop } from "@/components/site/ScrollToTop";
import {
  DemoDialog,
  DemoDialogProvider,
} from "@/features/leads/demo-dialog";

/** App chrome: scroll reset and the shared demo dialog. Page headers stay on each page. */
export function Shell() {
  return (
    <DemoDialogProvider>
      <ScrollToTop />
      <Outlet />
      <DemoDialog />
    </DemoDialogProvider>
  );
}
