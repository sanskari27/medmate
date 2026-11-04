import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { offices } from '@/content/pages/contact';

export function OfficeLocations() {
  return (
    <section className="nl-sec" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            Where we are
          </span>
          <h2>Our offices</h2>
        </div>
        <div className="nl-cov-grid">
          {offices.map((office) => (
            <div key={office.city} className="nl-office">
              <h4>
                <LocationPinIcon /> {office.city}{' '}
                <span className="tag">{office.tag}</span>
              </h4>
              <p>{office.address}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
