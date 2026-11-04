import { Link } from 'react-router-dom';
import { BrandMarkIcon } from '@/components/icons/BrandMarkIcon';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { brand, coverageAreas, footer, metrics } from '@/content/landing/site';

type SiteFooterProps = {
  fragmentPrefix: '' | '/';
  onBookDemo: () => void;
};

function FooterAnchor({
  href,
  label,
  fragmentPrefix,
  onBookDemo,
}: {
  href: string;
  label: string;
  fragmentPrefix: '' | '/';
  onBookDemo: () => void;
}) {
  if (href === '/#book-demo') {
    return (
      <a
        href={`${fragmentPrefix}#book-demo`}
        onClick={(event) => {
          event.preventDefault();
          onBookDemo();
        }}
      >
        {label}
      </a>
    );
  }

  if (href.startsWith('/#')) {
    return <a href={`${fragmentPrefix}${href.slice(1)}`}>{label}</a>;
  }

  if (href.startsWith('http')) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {label}
      </a>
    );
  }

  return <Link to={href}>{label}</Link>;
}

export function SiteFooter({ fragmentPrefix, onBookDemo }: SiteFooterProps) {
  return (
    <footer className="nl-footer">
      <div className="nl-wrap">
        <div className="nl-foot-cov" id="coverage">
          <h4>
            <LocationPinIcon /> Across Bengaluru{' '}
            <span className="nl-foot-cov-total">
              {metrics.pinCodes} pin codes
            </span>
          </h4>
          <div className="nl-foot-cov-grid">
            {coverageAreas.map((area) => (
              <div key={area.region} className="nl-foot-cov-col">
                <b>
                  {area.region} <em>{area.pinCodes}</em>
                </b>
                <span>{area.neighborhoods}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="nl-foot-grid">
          <div className="nl-foot-brand">
            <Link className="nl-brand" to="/" aria-label={`${brand.name} home`}>
              <span className="nl-mark">
                <BrandMarkIcon />
              </span>
              <span className="nl-wordmark">
                <span className="nm">Namma</span> MedMate
              </span>
            </Link>
            <p>{footer.blurb}</p>
          </div>
          {footer.columns.map((column) => (
            <div key={column.title} className="nl-foot-col">
              <h4>{column.title}</h4>
              {column.links.map((link) => (
                <FooterAnchor
                  key={link.label}
                  {...link}
                  fragmentPrefix={fragmentPrefix}
                  onBookDemo={onBookDemo}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="nl-foot-bottom">
          <span>
            © 2026 {brand.legal} · {brand.location}
          </span>
          <span>
            <Link to="/terms">Terms</Link>
            {' · '}
            <Link to="/privacy">Privacy</Link>
            {' · '}
            <Link to="/refund">Refund policy</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
