import { OnlineStoreIcon } from '@/components/icons/OnlineStoreIcon';
import { ShieldCheckIcon } from '@/components/icons/ShieldCheckIcon';
import { ZapIcon } from '@/components/icons/ZapIcon';
import { pharmacyOwnerWhyNow } from '@/content/pages/pharmacy-owner';

const whyIcons = {
  zap: ZapIcon,
  shield: ShieldCheckIcon,
  store: OnlineStoreIcon,
} as const;

export function PharmacyOwnerWhyNow() {
  return (
    <section className="nl-sec" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            {pharmacyOwnerWhyNow.eyebrow}
          </span>
          <h2>{pharmacyOwnerWhyNow.heading}</h2>
        </div>
        <div className="nl-feat-grid">
          {pharmacyOwnerWhyNow.items.map((item) => {
            const Icon = whyIcons[item.icon];
            return (
              <div className="nl-feat" key={item.title}>
                <div className="nl-feat-ic">
                  <Icon />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
