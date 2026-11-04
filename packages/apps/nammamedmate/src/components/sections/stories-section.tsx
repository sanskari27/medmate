import { ArrowRightSmallIcon } from '@/components/icons/ArrowRightSmallIcon';
import { StarIcon } from '@/components/icons/StarIcon';
import { TestimonialPlayIcon } from '@/components/icons/TestimonialPlayIcon';
export function StoriesSection() {
  return (
    <section className="nl-sec" id="stories" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            Loved by chemists
          </span>
          <h2>Hear it from shop owners</h2>
          <p>
            {
              "Video stories from Bengaluru pharmacies are on the way. Here's what early partners tell us in the meantime."
            }
          </p>
        </div>
        <div className="nl-testi-grid">
          <div className="nl-testi">
            <figure className="nl-video">
              <button
                type="button"
                className="nl-video-thumb is-soon"
                style={{ aspectRatio: '16 / 9' }}
                aria-label="Video — story coming soon"
              >
                <span className="nl-video-avatar" aria-hidden={true}>
                  R
                </span>
                <span className="nl-video-play" aria-hidden={true}>
                  <TestimonialPlayIcon />
                </span>
                <span className="nl-video-soon">Story coming soon</span>
              </button>
            </figure>
            <div className="nl-stars">
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
            </div>
            <p>
              {
                "“Billing that used to take a minute is done in seconds, and my expiry losses are almost gone. Everything's in one place now — and I'll be ready the day online orders switch on.”"
              }
            </p>
            <div className="nl-testi-who">
              <span className="nl-avatar">R</span>
              <span>
                <b>Rajesh Kumar</b>
                <span>Sri Sai Medicals · Koramangala</span>
              </span>
            </div>
          </div>
          <div className="nl-testi">
            <figure className="nl-video">
              <button
                type="button"
                className="nl-video-thumb is-soon"
                style={{ aspectRatio: '16 / 9' }}
                aria-label="Video — story coming soon"
              >
                <span className="nl-video-avatar" aria-hidden={true}>
                  F
                </span>
                <span className="nl-video-play" aria-hidden={true}>
                  <TestimonialPlayIcon />
                </span>
                <span className="nl-video-soon">Story coming soon</span>
              </button>
            </figure>
            <div className="nl-stars">
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
            </div>
            <p>
              {
                '“The ward-credit khata alone was worth it. I stopped chasing hospital payments on paper — statements go out automatically now.”'
              }
            </p>
            <div className="nl-testi-who">
              <span className="nl-avatar">F</span>
              <span>
                <b>Fathima Noor</b>
                <span>CityCare Pharmacy · Frazer Town</span>
              </span>
            </div>
          </div>
          <div className="nl-testi">
            <figure className="nl-video">
              <button
                type="button"
                className="nl-video-thumb is-soon"
                style={{ aspectRatio: '16 / 9' }}
                aria-label="Video — story coming soon"
              >
                <span className="nl-video-avatar" aria-hidden={true}>
                  A
                </span>
                <span className="nl-video-play" aria-hidden={true}>
                  <TestimonialPlayIcon />
                </span>
                <span className="nl-video-soon">Story coming soon</span>
              </button>
            </figure>
            <div className="nl-stars">
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
              <span>
                <StarIcon />
              </span>
            </div>
            <p>
              {
                '“Set up in a week with all my old stock migrated. My staff picked up the billing screen in a day. Support answers on WhatsApp.”'
              }
            </p>
            <div className="nl-testi-who">
              <span className="nl-avatar">A</span>
              <span>
                <b>Anil Shetty</b>
                <span>Shetty Medical Hall · Jayanagar</span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '34px' }}>
          <a className="nl-btn nl-btn-ghost" href="/stories">
            See all customer stories
            <ArrowRightSmallIcon />
          </a>
        </div>
      </div>
    </section>
  );
}
