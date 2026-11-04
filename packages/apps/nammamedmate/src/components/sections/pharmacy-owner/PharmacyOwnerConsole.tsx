import { BarChartIcon } from '@/components/icons/BarChartIcon';
import { HospitalIcon } from '@/components/icons/HospitalIcon';
import { InventoryBoxIcon } from '@/components/icons/InventoryBoxIcon';
import { InvoiceIcon } from '@/components/icons/InvoiceIcon';
import { PatientsIcon } from '@/components/icons/PatientsIcon';
import { PurchaseIcon } from '@/components/icons/PurchaseIcon';
import { pharmacyOwnerConsole } from '@/content/pages/pharmacy-owner';

const consoleIcons = {
  invoice: InvoiceIcon,
  inventory: InventoryBoxIcon,
  purchase: PurchaseIcon,
  patients: PatientsIcon,
  hospital: HospitalIcon,
  chart: BarChartIcon,
} as const;

export function PharmacyOwnerConsole() {
  return (
    <section className="nl-sec" id="console" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            {pharmacyOwnerConsole.eyebrow}
          </span>
          <h2>{pharmacyOwnerConsole.heading}</h2>
          <p>{pharmacyOwnerConsole.intro}</p>
        </div>
        <div className="nl-feat-grid">
          {pharmacyOwnerConsole.features.map((feature) => {
            const Icon = consoleIcons[feature.icon];
            return (
              <div className="nl-feat" key={feature.title}>
                <div className="nl-feat-ic">
                  <Icon />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
