import { Route, Routes } from "react-router-dom";
import { Shell } from "@/shell";
import { paths } from "@/paths";
import AboutPage from "@/pages/about/page";
import ContactPage from "@/pages/contact/page";
import HomePage from "@/pages/home/page";
import NotFoundPage from "@/pages/not-found/page";
import PharmacyOwnerPage from "@/pages/pharmacy-owner/page";
import PrivacyPage from "@/pages/privacy/page";
import RefundPage from "@/pages/refund/page";
import StoriesPage from "@/pages/stories/page";
import TermsPage from "@/pages/terms/page";

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path={paths.home} element={<HomePage />} />
        <Route path={paths.pharmacyOwner} element={<PharmacyOwnerPage />} />
        <Route path={paths.stories} element={<StoriesPage />} />
        <Route path={paths.about} element={<AboutPage />} />
        <Route path={paths.contact} element={<ContactPage />} />
        <Route path={paths.privacy} element={<PrivacyPage />} />
        <Route path={paths.terms} element={<TermsPage />} />
        <Route path={paths.refund} element={<RefundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
