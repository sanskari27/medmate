import { useEffect, useState } from 'react';
import { LandingLayout } from '@/components/layout/LandingLayout';
import { StoriesCta } from '@/components/sections/stories/StoriesCta';
import { StoryCard } from '@/components/sections/stories/StoryCard';
import { StoryTabs } from '@/components/sections/stories/StoryTabs';
import { stories, type StoryTab } from '@/content/pages/stories';
import { useDemoDialog } from '@/features/leads/demo-dialog';

export function StoriesPage() {
  const { openDemo } = useDemoDialog();
  const [tab, setTab] = useState<StoryTab>('all');
  const visibleStories =
    tab === 'all' ? stories : stories.filter((story) => story.tab === tab);

  useEffect(() => {
    document.title = 'Customer Stories | Namma MedMate Bengaluru';
  }, []);

  return (
    <LandingLayout>
      <section
        className="nl-sec"
        style={{
          background: 'linear-gradient(180deg, #eef5f0, #fff)',
          paddingBottom: 40,
        }}
      >
        <div className="nl-wrap">
          <div className="nl-sec-head">
            <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
              Customer stories
            </span>
            <h1 className="nl-about-h1">Built for every kind of pharmacy</h1>
            <p>
              Video stories are being filmed with our early partners across
              Bengaluru. Until they&apos;re live, here&apos;s how different
              kinds of pharmacies put Namma MedMate to work every day.
            </p>
          </div>
        </div>
      </section>
      <section
        className="nl-sec"
        style={{ background: '#fff', paddingTop: 20 }}
      >
        <div className="nl-wrap">
          <StoryTabs activeTab={tab} onChange={setTab} />
          <div className="nl-story-grid">
            {visibleStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      </section>
      <StoriesCta onBookDemo={openDemo} />
    </LandingLayout>
  );
}

export default StoriesPage;
