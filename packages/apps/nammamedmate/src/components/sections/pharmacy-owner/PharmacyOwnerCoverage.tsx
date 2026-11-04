import { metrics } from '@/content/landing/site';
import { pharmacyOwnerCoverage } from '@/content/pages/pharmacy-owner';

export function PharmacyOwnerCoverage() {
  return (
    <section className="nl-sec" id="coverage" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            {pharmacyOwnerCoverage.eyebrow}
          </span>
          <h2>{pharmacyOwnerCoverage.heading}</h2>
          <p>
            {pharmacyOwnerCoverage.introBefore}
            <b>{metrics.pinCodes} Bengaluru pin codes</b>
            {pharmacyOwnerCoverage.introAfter}
          </p>
        </div>
        <div className="nl-soon">
          <span className="nl-soon-label">
            {pharmacyOwnerCoverage.soonLabel}
          </span>
          {pharmacyOwnerCoverage.cities.map((city) => (
            <span className="nl-soon-chip" key={city}>
              {city}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
