import { useEffect } from 'react';
import { LandingLayout } from '@/components/layout/LandingLayout';
import {
  AboutCta,
  FounderVideo,
  TeamAndCompanyInformation,
  ValuesGrid,
} from '@/components/sections/about/AboutDetails';
import { AboutHero } from '@/components/sections/about/AboutHero';
import { FounderStory } from '@/components/sections/about/FounderStory';
import { useDemoDialog } from '@/features/leads/demo-dialog';

export function AboutPage() {
  const { openDemo } = useDemoDialog();

  useEffect(() => {
    document.title = 'About Us — Our Story & Founder | Namma MedMate Bengaluru';
  }, []);

  return (
    <LandingLayout>
      <AboutHero />
      <FounderStory />
      <FounderVideo />
      <ValuesGrid />
      <TeamAndCompanyInformation />
      <AboutCta onBookDemo={openDemo} />
    </LandingLayout>
  );
}

export default AboutPage;
