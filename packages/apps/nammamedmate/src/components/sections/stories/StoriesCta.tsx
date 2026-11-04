import { Link } from 'react-router-dom';
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';

export function StoriesCta({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section className="nl-sec" style={{ background: 'var(--surface)' }}>
      <div className="nl-wrap">
        <div className="nl-cta">
          <h2>Run a pharmacy? Your story could be next.</h2>
          <p>
            Set up your console in about a week — billing, inventory, CRM and
            hospital credit today, with an online store and delivery launching
            soon. Free to start.
          </p>
          <div className="nl-cta-btns">
            <button
              type="button"
              className="nl-btn nl-btn-gold nl-btn-lg"
              onClick={onBookDemo}
            >
              Book a free demo
            </button>
            <Link className="nl-btn nl-btn-ghost nl-btn-lg" to="/#different">
              How we&apos;re different <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
