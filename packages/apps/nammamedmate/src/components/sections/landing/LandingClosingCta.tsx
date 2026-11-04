import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
type LandingClosingCtaProps = {
  onBookDemo: () => void;
};

export function LandingClosingCta({ onBookDemo }: LandingClosingCtaProps) {
  return (
    <>
      <section
        className="nl-sec"
        style={{ background: '#fff', paddingBottom: '24px' }}
      >
        <div className="nl-wrap">
          <div className="nl-slogan">
            <p className="nl-slogan-text">
              Every sale becomes <em>a relationship.</em>
            </p>
            <span className="nl-slogan-label">
              Our promise to every shopkeeper
            </span>
          </div>
        </div>
      </section>
      <section className="nl-sec" style={{ background: '#fff', paddingTop: 0 }}>
        <div className="nl-wrap">
          <div className="nl-cta" id="book-demo">
            <h2>Run your whole pharmacy on one console</h2>
            <p>
              Join 750+ chemists running billing, inventory, CRM and credit
              today — with an online store and delivery launching soon. Free to
              start, live in about 7 days.
            </p>
            <div className="nl-cta-btns">
              <button
                type="button"
                className="nl-btn nl-btn-gold nl-btn-lg"
                onClick={onBookDemo}
              >
                Book a free demo
              </button>
              <a
                className="nl-btn nl-btn-ghost nl-btn-lg"
                href="/assets/pharmacy-console"
              >
                Explore the console <ArrowRightIcon />
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
