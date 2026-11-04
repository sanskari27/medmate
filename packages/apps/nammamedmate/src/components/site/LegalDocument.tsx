import { Link } from 'react-router-dom';
import { config } from '@/lib/site';
import { brand } from '@/content/landing/site';
import { useDemoDialog } from '@/features/leads/demo-dialog';

type LegalSection = {
  heading: string;
  paragraphs: readonly string[];
};

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  sections: readonly LegalSection[];
};

export function LegalDocument({
  title,
  lastUpdated,
  sections,
}: LegalDocumentProps) {
  const { openDemo } = useDemoDialog();

  return (
    <div className="nl-root" data-testid="legal-page">
      <header className="nl-header">
        <div className="nl-wrap nl-nav">
          <Link className="nl-brand" to="/" aria-label="Namma MedMate home">
            <span className="nl-wordmark">
              <span className="nm">Namma</span> MedMate
            </span>
          </Link>
          <div className="nl-nav-right">
            <button
              type="button"
              className="nl-btn nl-btn-primary"
              onClick={openDemo}
            >
              Book a free demo
            </button>
          </div>
        </div>
      </header>
      <main className="nl-sec" style={{ background: '#fff', paddingTop: 48 }}>
        <article className="nl-wrap" style={{ maxWidth: 720 }}>
          <p className="nl-eyebrow">Legal</p>
          <h1 style={{ marginTop: 14, fontSize: 'clamp(28px, 4vw, 42px)' }}>
            {title}
          </h1>
          <p style={{ marginTop: 16, color: 'var(--muted)' }}>
            Last updated {lastUpdated} · {brand.legal}
          </p>
          <div
            style={{
              marginTop: 40,
              display: 'flex',
              flexDirection: 'column',
              gap: 32,
            }}
          >
            {sections.map((section) => {
              const sectionId = section.heading
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
              return (
                <section key={section.heading} id={sectionId}>
                  <h2 style={{ fontSize: 22, marginBottom: 12 }}>
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((p) => (
                    <p
                      key={p.slice(0, 48)}
                      style={{
                        marginBottom: 12,
                        color: 'var(--ink)',
                        lineHeight: 1.65,
                      }}
                    >
                      {p}
                    </p>
                  ))}
                </section>
              );
            })}
          </div>
          <p style={{ marginTop: 48, color: 'var(--muted)', fontSize: 14 }}>
            Questions?{' '}
            <a href={`mailto:${config.supportEmail}`}>{config.supportEmail}</a>
            {' · '}
            <Link to="/">Back to home</Link>
          </p>
        </article>
      </main>
      <footer className="nl-footer">
        <div className="nl-wrap">
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
    </div>
  );
}
