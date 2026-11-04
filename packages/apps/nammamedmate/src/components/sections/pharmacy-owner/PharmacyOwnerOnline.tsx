import { BulletCheckIcon } from '@/components/icons/BulletCheckIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { pharmacyOwnerOnline } from '@/content/pages/pharmacy-owner';

export function PharmacyOwnerOnline() {
  return (
    <section className="nl-sec nl-showcase" id="online">
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            {pharmacyOwnerOnline.eyebrow}
          </span>
          <h2>{pharmacyOwnerOnline.heading}</h2>
          <p>{pharmacyOwnerOnline.intro}</p>
        </div>
        <div className="nl-steps">
          {pharmacyOwnerOnline.steps.map((step) => (
            <div className="nl-step" key={step.num}>
              <div className="nl-step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
        <div className="nl-showcase-tags">
          {pharmacyOwnerOnline.tags.map((tag) => (
            <span className="nl-dtag" key={tag.label}>
              {tag.icon === 'clock' ? <ClockIcon /> : <BulletCheckIcon />}{' '}
              {tag.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
