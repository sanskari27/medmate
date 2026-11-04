import { useState } from 'react';
import { ComparisonSection } from './comparison-section';
import { ConsoleShowcaseSection } from './console-showcase-section';
import { FeaturesSection } from './features-section';
import { HowItWorksSection } from './how-it-works-section';
import { FaqSection } from './landing/FaqSection';
import { LandingClosingCta } from './landing/LandingClosingCta';
import { LandingHero } from './landing/LandingHero';
import { PartnersSection } from './partners-section';
import { PricingSection } from './pricing/PricingSection';
import { StoriesSection } from './stories-section';
import { ToolkitSection } from './toolkit-section';
import { PromoBanner } from '@/components/site/PromoBanner';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { useDemoDialog } from '@/features/leads/demo-dialog';

/**
 * Full pharmacy-partner landing page composition.
 */
export function LandingPage() {
  const { openDemo } = useDemoDialog();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="nl-root">
      <div id="top">
        <PromoBanner />
        <div className="nl-announce">
          🚀 Now onboarding neighbourhood chemists across <b>Bengaluru</b>
          {' — '}
          <a
            href="#book-demo"
            onClick={(event) => {
              event.preventDefault();
              openDemo();
            }}
          >
            book a free demo →
          </a>
        </div>
        <SiteHeader fragmentPrefix="" onBookDemo={openDemo} />
        <LandingHero onBookDemo={openDemo} />
        <ConsoleShowcaseSection />
        <FeaturesSection />
        <ToolkitSection />
        <HowItWorksSection />
        <ComparisonSection />
        <PricingSection
          billing={billing}
          setBilling={setBilling}
          openDemo={openDemo}
        />
        <StoriesSection />
        <PartnersSection />
        <FaqSection />
        <LandingClosingCta onBookDemo={openDemo} />
        <SiteFooter fragmentPrefix="" onBookDemo={openDemo} />
      </div>
    </div>
  );
}
