import { ArrowRightIcon } from '@/components/icons/ArrowRightIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { OnlineStoreIcon } from '@/components/icons/OnlineStoreIcon';
import { pharmacyOwnerHero } from '@/content/pages/pharmacy-owner';

export function PharmacyOwnerHero() {
  return (
    <section className="nl-hero">
      <div className="nl-wrap nl-hero-grid">
        <div>
          <span className="nl-eyebrow">{pharmacyOwnerHero.eyebrow}</span>
          <h1>
            {pharmacyOwnerHero.headlineBefore}
            <em>{pharmacyOwnerHero.headlineEm}</em>
          </h1>
          <p className="nl-hero-sub">
            {pharmacyOwnerHero.subBefore}
            <b>{pharmacyOwnerHero.subBold1}</b>
            {pharmacyOwnerHero.subMid}
            <b>{pharmacyOwnerHero.subBold2}</b>
            {pharmacyOwnerHero.subAfter}
          </p>
          <div className="nl-hero-status">
            <ClockIcon />
            <span>
              <b>{pharmacyOwnerHero.statusBold}</b>
              {pharmacyOwnerHero.statusRest}
            </span>
          </div>
          <div className="nl-hero-stats">
            {pharmacyOwnerHero.stats.map((stat) => (
              <div className="nl-hstat" key={stat.label}>
                <b className={stat.gold ? 'g' : ''}>{stat.value}</b>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="nl-hero-cta">
            <a className="nl-btn nl-btn-primary nl-btn-lg" href="#demo">
              {pharmacyOwnerHero.primaryCta} <ArrowRightIcon />
            </a>
            <a className="nl-btn nl-btn-ghost nl-btn-lg" href="#whatyouget">
              {pharmacyOwnerHero.secondaryCta} <ArrowRightIcon />
            </a>
          </div>
        </div>
        <div className="nl-hero-visual nl-photo-hero">
          <img
            className="nl-photo-hero-img"
            src="/assets/landing/pharmacy-hero.jpg"
            alt={pharmacyOwnerHero.imageAlt}
          />
          <div className="nl-hero-badge">
            <span className="ic">
              <OnlineStoreIcon />
            </span>
            <span>
              <b>{pharmacyOwnerHero.badgeTitle}</b>
              <span>{pharmacyOwnerHero.badgeSub}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
