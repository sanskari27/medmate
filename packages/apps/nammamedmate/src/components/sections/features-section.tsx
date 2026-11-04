import { DeliveryTruckIcon } from '@/components/icons/DeliveryTruckIcon';
import { HospitalIcon } from '@/components/icons/HospitalIcon';
import { InvoiceIcon } from '@/components/icons/InvoiceIcon';
import { OnlineStoreIcon } from '@/components/icons/OnlineStoreIcon';
import { PatientsIcon } from '@/components/icons/PatientsIcon';
import { SalesChartIcon } from '@/components/icons/SalesChartIcon';
export function FeaturesSection() {
  return (
    <section
      className="nl-sec"
      id="features"
      style={{ background: 'var(--surface)' }}
    >
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            Everything in one place
          </span>
          <h2>Run the whole pharmacy, not five apps</h2>
          <p>
            Billing, inventory, customers and credit today — with your online
            store and delivery launching soon — one console instead of a drawer
            full of registers.
          </p>
        </div>
        <div className="nl-feat-grid">
          <div className="nl-feat">
            <div className="nl-feat-ic">
              <OnlineStoreIcon />
            </div>
            <h3>{'Online store & delivery'}</h3>
            <p>
              Coming soon: turn your counter into an online shop. List stock,
              take orders and dispatch through the Namma rider network — set up
              now and go live the day it launches, no website to build.
            </p>
          </div>
          <div className="nl-feat">
            <div className="nl-feat-ic">
              <InvoiceIcon />
            </div>
            <h3>{'GST billing & ERP'}</h3>
            <p>
              {
                'Fast POS billing with GST-ready invoices, batch & expiry tracking, purchase entries and one-tap distributor reorders.'
              }
            </p>
          </div>
          <div className="nl-feat">
            <div className="nl-feat-ic">
              <PatientsIcon />
            </div>
            <h3>CRM · Patients</h3>
            <p>
              Every sale becomes a relationship — customers and prescriptions on
              file, with refill reminders, chronic-care follow-ups and loyalty
              that brings patients back.
            </p>
          </div>
          <div className="nl-feat">
            <div className="nl-feat-ic">
              <HospitalIcon />
            </div>
            <h3>{'Hospital & ward credit'}</h3>
            <p>
              Run khata for hospitals, wards and regulars. Track credit,
              statements and settlements without a single paper ledger.
            </p>
          </div>
          <div className="nl-feat">
            <div className="nl-feat-ic">
              <DeliveryTruckIcon />
            </div>
            <h3>Rider network</h3>
            <p>
              Coming soon: assign your own delivery boys or tap into shared
              Namma riders, with live tracking and OTP handover on every order.
            </p>
          </div>
          <div className="nl-feat">
            <div className="nl-feat-ic">
              <SalesChartIcon />
            </div>
            <h3>Owner dashboard</h3>
            <p>
              {
                "Today's sales, online vs counter split, top categories, plus stock-expiry and restocking notifications — the whole shop at a glance, on any device."
              }
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
