export function AboutHero() {
  return (
    <>
      <section
        className="nl-sec"
        style={{ background: 'var(--surface)', paddingBottom: 40 }}
      >
        <div className="nl-wrap">
          <div className="nl-sec-head">
            <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
              Namma MedMate, Bengaluru · est. 2026
            </span>
            <h1 className="nl-about-h1">
              Keeping India&apos;s neighbourhood chemists in business — and
              bringing their medicines to every doorstep.
            </h1>
            <p>
              Namma MedMate is a Bengaluru-based health-tech company building
              the operating system for India&apos;s 900,000 neighbourhood
              pharmacies. GST billing, live inventory, customer CRM and hospital
              credit are ready today — with an online store and 30-minute
              delivery launching soon across Bengaluru.
            </p>
          </div>
        </div>
      </section>
      <section
        className="nl-sec"
        style={{
          background: 'var(--surface)',
          paddingTop: 0,
          paddingBottom: 56,
        }}
      >
        <div className="nl-wrap">
          <div className="nl-stat-row">
            <div className="nl-stat-box">
              <b>2026</b>
              <span>Founded in Bengaluru</span>
            </div>
            <div className="nl-stat-box">
              <b className="g">750+</b>
              <span>Chemists in network</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
