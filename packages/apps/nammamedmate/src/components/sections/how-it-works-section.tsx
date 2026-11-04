export function HowItWorksSection() {
  return (
    <section
      className="nl-sec"
      id="how"
      style={{ background: 'var(--surface)' }}
    >
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            How it works
          </span>
          <h2>Live in about a week</h2>
          <p>
            No big migration project, no upfront cost. We do the heavy lifting
            and your staff learns it in a day.
          </p>
        </div>
        <div className="nl-steps">
          <div className="nl-step">
            <div className="nl-step-num">1</div>
            <h3>Book a free demo</h3>
            <p>
              A 20-minute WhatsApp or on-site walkthrough. We map your shop,
              stock and billing needs.
            </p>
          </div>
          <div className="nl-step">
            <div className="nl-step-num">2</div>
            <h3>We set you up</h3>
            <p>
              Your catalogue, GST details and staff logins go live in about 7
              days — we migrate your existing data.
            </p>
          </div>
          <div className="nl-step">
            <div className="nl-step-num">3</div>
            <h3>Go live on the console</h3>
            <p>
              {
                "Your billing, inventory, CRM and credit switch on from day one. Your online store and delivery go live the day we launch in Bengaluru — so you're ready first."
              }
            </p>
          </div>
          <div className="nl-step">
            <div className="nl-step-num">4</div>
            <h3>Grow with insights</h3>
            <p>
              Reorder smarter, cut expiry losses and win repeat patients with
              reminders and offers.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
