import { useEffect } from 'react';
import { PharmacyOwnerConsole } from '@/components/sections/pharmacy-owner/PharmacyOwnerConsole';
import { PharmacyOwnerCoverage } from '@/components/sections/pharmacy-owner/PharmacyOwnerCoverage';
import { PharmacyOwnerDemo } from '@/components/sections/pharmacy-owner/PharmacyOwnerDemo';
import { PharmacyOwnerHero } from '@/components/sections/pharmacy-owner/PharmacyOwnerHero';
import { PharmacyOwnerOnboard } from '@/components/sections/pharmacy-owner/PharmacyOwnerOnboard';
import { PharmacyOwnerOnline } from '@/components/sections/pharmacy-owner/PharmacyOwnerOnline';
import { PharmacyOwnerPricing } from '@/components/sections/pharmacy-owner/PharmacyOwnerPricing';
import { PharmacyOwnerStatus } from '@/components/sections/pharmacy-owner/PharmacyOwnerStatus';
import { PharmacyOwnerWhyNow } from '@/components/sections/pharmacy-owner/PharmacyOwnerWhyNow';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import {
  pharmacyOwnerAnnounce,
  pharmacyOwnerMeta,
} from '@/content/pages/pharmacy-owner';

function scrollToDemo() {
  document.getElementById('demo')?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

export function PharmacyOwnerPage() {
  useEffect(() => {
    document.title = pharmacyOwnerMeta.title;
  }, []);

  return (
    <div className="nl-root">
      <div id="top">
        <div className="nl-announce">
          🟢 {pharmacyOwnerAnnounce.before}
          <b>{pharmacyOwnerAnnounce.city}</b>
          {pharmacyOwnerAnnounce.after}
          <a
            href="#demo"
            onClick={(event) => {
              event.preventDefault();
              scrollToDemo();
            }}
          >
            {pharmacyOwnerAnnounce.link}
          </a>
        </div>
        <SiteHeader fragmentPrefix="/" onBookDemo={scrollToDemo} />
        <PharmacyOwnerHero />
        <PharmacyOwnerStatus />
        <PharmacyOwnerConsole />
        <PharmacyOwnerOnline />
        <PharmacyOwnerOnboard />
        <PharmacyOwnerWhyNow />
        <PharmacyOwnerPricing />
        <PharmacyOwnerCoverage />
        <PharmacyOwnerDemo />
        <SiteFooter fragmentPrefix="/" onBookDemo={scrollToDemo} />
      </div>
    </div>
  );
}

export default PharmacyOwnerPage;
