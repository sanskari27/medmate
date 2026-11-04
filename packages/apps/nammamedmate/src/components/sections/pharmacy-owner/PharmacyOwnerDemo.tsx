import { EarlyAccessForm } from '@/features/leads/early-access-form';
import { BulletCheckIcon } from '@/components/icons/BulletCheckIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { pharmacyOwnerDemo } from '@/content/pages/pharmacy-owner';

export function PharmacyOwnerDemo() {
  return (
    <section
      className="nl-sec"
      id="demo"
      style={{ background: 'var(--surface)' }}
    >
      <div className="nl-wrap">
        <div className="nl-demo">
          <div className="nl-demo-copy">
            <span className="nl-eyebrow">{pharmacyOwnerDemo.eyebrow}</span>
            <h2>{pharmacyOwnerDemo.heading}</h2>
            <p>
              {pharmacyOwnerDemo.introBefore}
              <b>{pharmacyOwnerDemo.introBold}</b>
              {pharmacyOwnerDemo.introAfter}
            </p>
            <ul className="nl-demo-points">
              {pharmacyOwnerDemo.points.map((point) => (
                <li key={point.text}>
                  {point.icon === 'clock' ? <ClockIcon /> : <BulletCheckIcon />}{' '}
                  {point.text}
                </li>
              ))}
            </ul>
          </div>
          <EarlyAccessForm />
        </div>
      </div>
    </section>
  );
}
