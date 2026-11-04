import { useState } from 'react';
import { DeliveryIcon } from '@/components/icons/DeliveryIcon';

export function PromoBanner() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`nl-promo${isOpen ? ' open' : ''}`}>
      <div className="nl-promo-card" role="status" aria-hidden>
        <div className="nl-promo-head">
          <span className="nl-promo-badge">
            <DeliveryIcon />
          </span>
          <span className="nl-promo-soon">
            <span className="nl-promo-dot" />
            Launching soon
          </span>
        </div>
        <h4 className="nl-promo-title">Start selling online</h4>
        <p className="nl-promo-text">
          Your online store &amp; delivery network go live soon in Bengaluru.
          Get set up now — you’ll be ready from day one.
        </p>
      </div>
      <button
        type="button"
        className="nl-promo-pill"
        aria-expanded={isOpen}
        aria-label="Sell online — coming soon"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="nl-promo-pill-ic">
          <DeliveryIcon />
        </span>
        <span>Sell online</span>
        <span className="nl-promo-pill-dot" aria-hidden />
      </button>
    </div>
  );
}
