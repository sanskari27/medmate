import type { ReactNode } from "react";
import { Route, Routes } from "react-router-dom";
import { Shell } from "@/shell";
import { Seo } from "@/components/seo";
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, type PageMeta } from "@/lib/site";
import About, { meta as aboutMeta } from "@/pages/about/page";
import AreaPage from "@/pages/bengaluru/area";
import Bengaluru, { meta as bengaluruMeta } from "@/pages/bengaluru/page";
import PostPage from "@/pages/blog/post";
import Blog, { meta as blogMeta } from "@/pages/blog/page";
import Contact, { meta as contactMeta } from "@/pages/contact/page";
import ContactThanks, { meta as contactThanksMeta } from "@/pages/contact/thanks";
import DoctorConsultation, { meta as consultMeta } from "@/pages/doctor-consultation/page";
import Download, { meta as downloadMeta } from "@/pages/download/page";
import Home, { meta as homeMeta } from "@/pages/home/page";
import MedicinePage from "@/pages/medicine/page";
import CategoryPage from "@/pages/medicines/category";
import Medicines, { meta as medicinesMeta } from "@/pages/medicines/page";
import NotFound from "@/pages/not-found/page";
import Partner, { meta as partnerMeta } from "@/pages/pharmacy-partner/page";
import PartnerThanks, { meta as partnerThanksMeta } from "@/pages/pharmacy-partner/thanks";
import Premium, { meta as premiumMeta } from "@/pages/premium/page";
import Privacy, { meta as privacyMeta } from "@/pages/privacy/page";
import Search, { meta as searchMeta } from "@/pages/search/page";
import Terms, { meta as termsMeta } from "@/pages/terms/page";
import Upload, { meta as uploadMeta } from "@/pages/upload-prescription/page";
import WaitlistThanks, { meta as waitlistMeta } from "@/pages/waitlist/thanks";

function Page({ meta, children }: { meta: PageMeta; children: ReactNode }) {
  return (
    <>
      <Seo {...meta} />
      {children}
    </>
  );
}

export function App() {
  return (
    <Routes>
      <Route element={<Shell />}>
      <Route path="/" element={<Page meta={homeMeta}><Home /></Page>} />
      <Route path="/download" element={<Page meta={downloadMeta}><Download /></Page>} />
      <Route path="/premium" element={<Page meta={premiumMeta}><Premium /></Page>} />
      <Route path="/medicines" element={<Page meta={medicinesMeta}><Medicines /></Page>} />
      <Route path="/medicines/:cat" element={<CategoryPage />} />
      <Route path="/medicine/:slug" element={<MedicinePage />} />
      <Route path="/bengaluru" element={<Page meta={bengaluruMeta}><Bengaluru /></Page>} />
      <Route path="/bengaluru/:area" element={<AreaPage />} />
      <Route path="/blog" element={<Page meta={blogMeta}><Blog /></Page>} />
      <Route path="/blog/:slug" element={<PostPage />} />
      <Route path="/pharmacy-partner" element={<Page meta={partnerMeta}><Partner /></Page>} />
      <Route path="/pharmacy-partner/thanks" element={<Page meta={partnerThanksMeta}><PartnerThanks /></Page>} />
      <Route path="/doctor-consultation" element={<Page meta={consultMeta}><DoctorConsultation /></Page>} />
      <Route path="/upload-prescription" element={<Page meta={uploadMeta}><Upload /></Page>} />
      <Route path="/about" element={<Page meta={aboutMeta}><About /></Page>} />
      <Route path="/contact" element={<Page meta={contactMeta}><Contact /></Page>} />
      <Route path="/contact/thanks" element={<Page meta={contactThanksMeta}><ContactThanks /></Page>} />
      <Route path="/waitlist/thanks" element={<Page meta={waitlistMeta}><WaitlistThanks /></Page>} />
      <Route path="/search" element={<Page meta={searchMeta}><Search /></Page>} />
      <Route path="/privacy" element={<Page meta={privacyMeta}><Privacy /></Page>} />
      <Route path="/terms" element={<Page meta={termsMeta}><Terms /></Page>} />
      <Route path="*" element={<Page meta={{ title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, path: "/", absolute: true, noindex: true, canonical: false }}><NotFound /></Page>} />
      </Route>
    </Routes>
  );
}
