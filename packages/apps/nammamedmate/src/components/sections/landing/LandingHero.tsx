import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
import { BulletCheckIcon } from '@/components/icons/BulletCheckIcon';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { SalesTrendIcon } from '@/components/icons/SalesTrendIcon';
import { metrics } from '@/content/landing/site';

type LandingHeroProps = {
  onBookDemo: () => void;
};

const benefits = [
  'Free to start',
  '7-day setup',
  'No lock-in',
  'WhatsApp support',
] as const;

export function LandingHero({ onBookDemo }: LandingHeroProps) {
  return (
    <>
      <section className="nl-hero">
        <div className="nl-wrap nl-hero-grid">
          <div>
            <span className="nl-eyebrow nl-eyebrow-lg">
              Every sale becomes <em>a relationship</em>
            </span>
            <h1>
              The Management Software your pharmacy <em>actually needs.</em>
            </h1>
            <p className="nl-hero-sub">
              <b>CRM, GST billing, inventory and hospital credit</b>
              {' — '}your whole shop in one console today, with an{' '}
              <b>online store and delivery network launching soon</b>.
            </p>
            <div className="nl-hero-cta">
              <button
                type="button"
                className="nl-btn nl-btn-primary nl-btn-lg"
                onClick={onBookDemo}
              >
                Book a free demo
              </button>
              <a className="nl-btn nl-btn-ghost nl-btn-lg" href="#console">
                See the console <ArrowRightIcon />
              </a>
            </div>
            <div className="nl-hero-chips">
              {benefits.map((benefit) => (
                <span key={benefit} className="nl-chip">
                  <BulletCheckIcon />
                  {benefit}
                </span>
              ))}
            </div>
          </div>

          <div className="nl-hero-visual">
            <div className="nl-browserbar">
              <div className="nl-browserbar-top">
                <span className="nl-dot" style={{ background: '#F87171' }} />
                <span className="nl-dot" style={{ background: '#FBBF24' }} />
                <span className="nl-dot" style={{ background: '#34D399' }} />
                <span className="nl-browserbar-url">
                  <LocationPinIcon />
                  app.nammamedmate.com/dashboard
                </span>
              </div>
              <img
                src="/assets/landing/dash-desktop.png"
                alt="Namma MedMate pharmacy dashboard on desktop"
              />
            </div>
            <div className="nl-hero-badge">
              <span className="ic">
                <SalesTrendIcon />
              </span>
              <span>
                <b>₹58,190</b>
                <span>sales · last 7 days</span>
              </span>
            </div>
            <img
              className="nl-hero-phone"
              src="/assets/landing/dash-phone.png"
              alt="Namma MedMate partner app on phone"
            />
          </div>
        </div>
      </section>
      <section className="nl-metrics">
        <div className="nl-wrap nl-metrics-single">
          Trusted by <b>{metrics.partners}</b> partner pharmacies across
          Bengaluru
        </div>
      </section>
    </>
  );
}
