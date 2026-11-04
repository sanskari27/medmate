import type { ReactNode } from 'react';
import { SiteFooter } from '@/components/site/SiteFooter';
import { SiteHeader } from '@/components/site/SiteHeader';
import { useDemoDialog } from '@/features/leads/demo-dialog';

type LandingLayoutProps = {
  children: ReactNode;
};

/**
 * Shared chrome for secondary landing-site pages.
 */
export function LandingLayout({ children }: LandingLayoutProps) {
  const { openDemo } = useDemoDialog();

  return (
    <div className="nl-root">
      <div id="top">
        <SiteHeader fragmentPrefix="/" onBookDemo={openDemo} />
        {children}
        <SiteFooter fragmentPrefix="/" onBookDemo={openDemo} />
      </div>
    </div>
  );
}
