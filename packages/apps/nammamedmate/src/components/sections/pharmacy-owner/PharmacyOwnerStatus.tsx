import { BulletCheckIcon } from '@/components/icons/BulletCheckIcon';
import { ClockIcon } from '@/components/icons/ClockIcon';
import { pharmacyOwnerStatus } from '@/content/pages/pharmacy-owner';

export function PharmacyOwnerStatus() {
  const { now, soon } = pharmacyOwnerStatus;

  return (
    <section
      className="nl-sec"
      id="whatyouget"
      style={{ background: 'var(--surface)' }}
    >
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            {pharmacyOwnerStatus.eyebrow}
          </span>
          <h2>{pharmacyOwnerStatus.heading}</h2>
          <p>{pharmacyOwnerStatus.intro}</p>
        </div>
        <div className="nl-status-grid">
          <div className="nl-status-card now">
            <div className="nl-status-head">
              <h3>{now.title}</h3>
              <span className="nl-status-badge live">{now.badge}</span>
            </div>
            <p className="nl-status-sub">{now.sub}</p>
            <ul className="nl-status-list">
              {now.items.map((item) => (
                <li key={item.title}>
                  <BulletCheckIcon />
                  <span>
                    <b>{item.title}</b> — {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="nl-status-card soon">
            <div className="nl-status-head">
              <h3>{soon.title}</h3>
              <span className="nl-status-badge soon">{soon.badge}</span>
            </div>
            <p className="nl-status-sub">{soon.sub}</p>
            <ul className="nl-status-list">
              {soon.items.map((item) => (
                <li key={item.title}>
                  <ClockIcon />
                  <span>
                    <b>{item.title}</b> — {item.detail}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
