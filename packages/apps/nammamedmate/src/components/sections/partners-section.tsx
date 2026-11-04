import { DataSecurityIcon } from '@/components/icons/DataSecurityIcon';
import { InsuranceIcon } from '@/components/icons/InsuranceIcon';
import { MedicineCatalogIcon } from '@/components/icons/MedicineCatalogIcon';
import { PaymentCardIcon } from '@/components/icons/PaymentCardIcon';
export function PartnersSection() {
  return (
    <section
      className="nl-sec"
      id="partners"
      style={{ background: 'var(--surface)' }}
    >
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            Not just software
          </span>
          <h2>An ecosystem around your counter</h2>
          <p>
            Distributor catalogues, insurance claims, payments and compliance —
            we’re building the connections that make your pharmacy easier to
            run. Each one is labelled with exactly where it stands.
          </p>
        </div>
        <div className="nl-partner-grid">
          <div className="nl-partner-card">
            <div className="nl-partner-top">
              <span className="nl-partner-ic">
                <MedicineCatalogIcon />
              </span>
              <span className="nl-partner-status is-rolling">Rolling out</span>
            </div>
            <h3>{'Distributors & pharma catalogues'}</h3>
            <p>
              {
                "Pull live product masters, MRP, pack sizes and HSN codes straight from India's leading distributors and manufacturers — so you never key in a medicine by hand."
              }
            </p>
            <div className="nl-partner-chips">
              <span className="nl-chip">Abbott</span>
              <span className="nl-chip">Cipla</span>
              <span className="nl-chip">Sun Pharma</span>
              <span className="nl-chip">Mankind</span>
              <span className="nl-chip">{"Dr. Reddy's"}</span>
              <span className="nl-chip">Alkem</span>
              <span className="nl-chip">Torrent</span>
              <span className="nl-chip">Zydus</span>
              <span className="nl-chip">Lupin</span>
              <span className="nl-chip">Glenmark</span>
            </div>
          </div>
          <div className="nl-partner-card">
            <div className="nl-partner-top">
              <span className="nl-partner-ic">
                <InsuranceIcon />
              </span>
              <span className="nl-partner-status is-soon">Coming soon</span>
            </div>
            <h3>{'Insurance & cashless claims'}</h3>
            <p>
              Claim-ready invoices and cashless billing for government health
              schemes and private insurers, so patients pay less at your counter
              and you get reimbursed faster.
            </p>
            <div className="nl-partner-chips">
              <span className="nl-chip">Ayushman Bharat · PMJAY</span>
              <span className="nl-chip">CGHS</span>
              <span className="nl-chip">ESI</span>
              <span className="nl-chip">Star Health</span>
              <span className="nl-chip">ICICI Lombard</span>
              <span className="nl-chip">HDFC ERGO</span>
            </div>
          </div>
          <div className="nl-partner-card">
            <div className="nl-partner-top">
              <span className="nl-partner-ic">
                <PaymentCardIcon />
              </span>
              <span className="nl-partner-status is-live">Live</span>
            </div>
            <h3>{'Payments & UPI'}</h3>
            <p>
              {
                "Take every payment mode at the counter — reconciled automatically into your day's sales, with online collection ready for when your store goes live."
              }
            </p>
            <div className="nl-partner-chips">
              <span className="nl-chip">UPI</span>
              <span className="nl-chip">Razorpay</span>
              <span className="nl-chip">Paytm</span>
              <span className="nl-chip">PhonePe</span>
              <span className="nl-chip">RuPay · Visa · Mastercard</span>
              <span className="nl-chip">{'Cash & card'}</span>
            </div>
          </div>
          <div className="nl-partner-card">
            <div className="nl-partner-top">
              <span className="nl-partner-ic">
                <DataSecurityIcon />
              </span>
              <span className="nl-partner-status is-live">Live</span>
            </div>
            <h3>{'Compliance & data safety'}</h3>
            <p>
              {
                "Built to India's pharmacy and data-protection rules from day one — your records are correct, auditable and yours to export any time."
              }
            </p>
            <div className="nl-partner-chips">
              <span className="nl-chip">GST-ready invoicing</span>
              <span className="nl-chip">Schedule-H workflow</span>
              <span className="nl-chip">DPDP-compliant</span>
              <span className="nl-chip">Daily encrypted backups</span>
              <span className="nl-chip">Role-based access</span>
            </div>
          </div>
        </div>
        <p className="nl-partner-note">
          Brand names show the partners and schemes we integrate with or are
          onboarding. Only items marked <b>Live</b> are available today;
          everything else is on the roadmap.{' '}
          <a href="/contact">See the full partnerships page →</a>
        </p>
      </div>
    </section>
  );
}
