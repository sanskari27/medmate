import { Outlet } from "react-router-dom";
import { JsonLd } from "@/components/ui";
import { FloatingApp, GetAppDialog, MobileCta } from "@/layout/get-app";
import { Footer, Header } from "@/layout/chrome";
import { LangProvider } from "@/features/language/lang";
import { qrSvg } from "@/lib/qr";
import { COMPANY, IOS_URL, PLAY_URL, SITE_URL, downloadUrl, whatsappHref } from "@/lib/site";

const dialogUrl = downloadUrl("dialog");
const dialogQr = qrSvg(dialogUrl);
const floatQr = qrSvg(downloadUrl("float"));
const footerQr = qrSvg(downloadUrl("footer"));

export function Shell() {
  const sameAs = [PLAY_URL, IOS_URL].filter(Boolean);
  return (
    <LangProvider>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2 focus:shadow-sh3">Skip to content</a>
      <Header />
      <div id="main">
        <Outlet />
      </div>
      <Footer qr={footerQr} />
      <GetAppDialog qr={dialogQr} whatsapp={whatsappHref(dialogUrl)} />
      <FloatingApp qr={floatQr} />
      <MobileCta />
      <JsonLd data={[
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${SITE_URL}/#org`,
          name: "MedMate",
          legalName: COMPANY,
          url: SITE_URL,
          logo: `${SITE_URL}/logo.png`,
          address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressRegion: "Karnataka", addressCountry: "IN" },
          areaServed: { "@type": "City", name: "Bengaluru" },
          slogan: "Care, delivered in minutes",
          foundingDate: "2026",
          founder: { "@type": "Person", name: "Roni Paul", jobTitle: "Founder & CEO" },
          ...(sameAs.length ? { sameAs } : {}),
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "MedMate",
          url: SITE_URL,
          inLanguage: "en-IN",
          publisher: { "@id": `${SITE_URL}/#org` },
          potentialAction: { "@type": "SearchAction", target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` }, "query-input": "required name=search_term_string" },
        },
      ]} />
    </LangProvider>
  );
}
