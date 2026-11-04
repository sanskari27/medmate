import { MailIcon } from '@/components/icons/MailIcon';
import { PhoneIcon } from '@/components/icons/PhoneIcon';
import { contactDepartments } from '@/content/pages/contact';

export function ContactDepartments() {
  return (
    <section className="nl-sec" style={{ background: '#fff', paddingTop: 0 }}>
      <div className="nl-wrap">
        <div className="nl-feat-grid nl-grid-2">
          {contactDepartments.map((department) => (
            <div key={department.title} className="nl-dept">
              <h3>{department.title}</h3>
              <p className="purpose">{department.purpose}</p>
              <div className="nl-dept-row">
                <MailIcon />{' '}
                <a href={`mailto:${department.email}`}>{department.email}</a>
              </div>
              <div className="nl-dept-row">
                <PhoneIcon />{' '}
                <a href={`tel:${department.tel}`}>{department.phone}</a>
              </div>
              <div className="nl-dept-hours">{department.hours}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
