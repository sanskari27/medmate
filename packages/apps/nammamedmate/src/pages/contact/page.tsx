import { useEffect } from 'react';
import { LandingLayout } from '@/components/layout/LandingLayout';
import { ContactDepartments } from '@/components/sections/contact/ContactDepartments';
import { ContactMessageSection } from '@/components/sections/contact/ContactMessageSection';
import { OfficeLocations } from '@/components/sections/contact/OfficeLocations';

export function ContactPage() {
  useEffect(() => {
    document.title = 'Contact Us | Namma MedMate Bengaluru';
  }, []);

  return (
    <LandingLayout>
      <section
        className="nl-sec"
        style={{ background: 'var(--surface)', paddingBottom: 40 }}
      >
        <div className="nl-wrap">
          <div className="nl-sec-head">
            <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
              Real humans. Real fast.
            </span>
            <h2>Pick the right inbox</h2>
            <p>
              We read every email. For live help with an order, the in-app chat
              is the fastest way to reach us.
            </p>
          </div>
        </div>
      </section>
      <ContactDepartments />
      <ContactMessageSection />
      <OfficeLocations />
    </LandingLayout>
  );
}

export default ContactPage;
