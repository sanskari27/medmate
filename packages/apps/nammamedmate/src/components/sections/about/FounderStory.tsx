import { useState } from 'react';
import { ChevronDownIcon } from '@/components/icons/ChevronDownIcon';
import { founderStory } from '@/content/pages/about';

export function FounderStory() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="nl-sec" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-founder">
          <div className="nl-founder-media">
            <img
              src="/assets/landing/founder-roni.jpg"
              alt="Roni Paul, Founder and CEO of Namma MedMate, Bengaluru"
              width={820}
              height={880}
            />
            <div className="nl-founder-cap">
              <b>Roni Paul</b>
              <span>Founder &amp; CEO · Namma MedMate</span>
            </div>
          </div>
          <div className="nl-prose nl-founder-story">
            <span className="nl-eyebrow">Our story</span>
            <h3>Why we started</h3>
            {founderStory.intro.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            {isExpanded ? (
              <div id="story-more" className="nl-more-inner">
                <p>{founderStory.details[0]}</p>
                <blockquote>{founderStory.quote}</blockquote>
                {founderStory.details.slice(1).map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            ) : null}
            <button
              type="button"
              className={`nl-readmore${isExpanded ? ' open' : ''}`}
              aria-expanded={isExpanded}
              aria-controls="story-more"
              onClick={() => setIsExpanded((expanded) => !expanded)}
            >
              {isExpanded ? 'Read less' : 'Read more'}
              <span className="chev" aria-hidden>
                <ChevronDownIcon />
              </span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
