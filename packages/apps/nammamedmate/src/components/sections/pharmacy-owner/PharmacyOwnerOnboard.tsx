import { pharmacyOwnerOnboard } from '@/content/pages/pharmacy-owner';

export function PharmacyOwnerOnboard() {
  return (
    <section
      className="nl-sec"
      id="onboard"
      style={{ background: 'var(--surface)' }}
    >
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            {pharmacyOwnerOnboard.eyebrow}
          </span>
          <h2>{pharmacyOwnerOnboard.heading}</h2>
          <p>{pharmacyOwnerOnboard.intro}</p>
        </div>
        <div className="nl-steps">
          {pharmacyOwnerOnboard.steps.map((step) => (
            <div className="nl-step" key={step.num}>
              <div className="nl-step-num">{step.num}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
