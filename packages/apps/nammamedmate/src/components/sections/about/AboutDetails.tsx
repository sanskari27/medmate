import { Link } from 'react-router-dom';
import { AboutValueIcon } from '@/components/icons/AboutValueIcon';
import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
import { PlayIcon } from '@/components/icons/PlayIcon';
import { aboutValues, companyInformation, team } from '@/content/pages/about';

export function FounderVideo() {
  return (
    <section className="nl-sec" style={{ background: '#fff', paddingTop: 0 }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            In his words
          </span>
          <h2>A message from our founder</h2>
          <p>
            Roni on why Namma MedMate exists — and what he wants it to mean for
            every neighbourhood chemist.
          </p>
        </div>
        <div className="nl-founder-video">
          <figure className="nl-video">
            <button
              type="button"
              className="nl-video-thumb is-soon"
              style={{ aspectRatio: '16 / 9' }}
              aria-label="Why we built Namma MedMate — video coming soon"
            >
              <span className="nl-video-play" aria-hidden>
                <PlayIcon />
              </span>
              <span className="nl-video-soon">Video coming soon</span>
            </button>
            <figcaption className="nl-video-cap">
              <span className="nl-video-kicker">Founder story</span>
              <b>Why we built Namma MedMate</b>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export function ValuesGrid() {
  return (
    <section className="nl-sec" style={{ background: 'var(--surface)' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            What we stand for
          </span>
          <h2>Our values</h2>
        </div>
        <div className="nl-feat-grid nl-grid-4">
          {aboutValues.map((value) => (
            <div key={value.title} className="nl-feat">
              <div className="nl-feat-ic">
                <AboutValueIcon icon={value.icon} />
              </div>
              <h3>{value.title}</h3>
              <p>{value.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function TeamAndCompanyInformation() {
  return (
    <>
      <section className="nl-sec" style={{ background: '#fff' }}>
        <div className="nl-wrap">
          <div className="nl-sec-head">
            <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
              The team
            </span>
            <h2>Meet the team</h2>
            <p>
              Founders, doctors, engineers and pharmacists building for the
              corner chemist.
            </p>
          </div>
          <div className="nl-team-grid">
            {team.map((member) => (
              <div key={member.initials} className="nl-team">
                <span className="nl-avatar">{member.initials}</span>
                <b>{member.name}</b>
                <span>{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="nl-sec" style={{ background: 'var(--surface)' }}>
        <div className="nl-wrap">
          <div className="nl-sec-head">
            <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
              The fine print
            </span>
            <h2>Company information</h2>
          </div>
          <div className="nl-legal">
            {companyInformation.map((item) => (
              <div key={item.label} className="nl-legal-row">
                <b>{item.label}</b>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export function AboutCta({ onBookDemo }: { onBookDemo: () => void }) {
  return (
    <section className="nl-sec" style={{ background: '#fff', paddingTop: 0 }}>
      <div className="nl-wrap">
        <div className="nl-cta">
          <h2>Run a pharmacy? Let&apos;s talk.</h2>
          <p>
            Get your whole shop on one console in about a week — billing,
            inventory, CRM and hospital credit today, with an online store and
            delivery launching soon. Free to start.
          </p>
          <div className="nl-cta-btns">
            <button
              type="button"
              className="nl-btn nl-btn-gold nl-btn-lg"
              onClick={onBookDemo}
            >
              Book a free demo
            </button>
            <Link className="nl-btn nl-btn-ghost nl-btn-lg" to="/contact">
              Contact us <ArrowRightIcon />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
