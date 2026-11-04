export const contactDepartments = [
  {
    title: 'Customer Support',
    purpose: 'Order issues, refunds, delivery questions.',
    email: 'support@nammamedmate.com',
    phone: '+91 80 4567 8900',
    tel: '+918045678900',
    hours: '24×7',
  },
  {
    title: 'Pharmacy Partnerships',
    purpose: 'Sell on the platform, integrations.',
    email: 'partners@nammamedmate.com',
    phone: '+91 80 4567 8910',
    tel: '+918045678910',
    hours: 'Mon–Sat, 10am–7pm',
  },
  {
    title: 'Press & Media',
    purpose: 'Story, interviews, brand assets.',
    email: 'press@nammamedmate.com',
    phone: '+91 80 4567 8920',
    tel: '+918045678920',
    hours: 'Mon–Fri, 10am–6pm',
  },
  {
    title: 'Careers',
    purpose: 'Join the team.',
    email: 'careers@nammamedmate.com',
    phone: '+91 80 4567 8930',
    tel: '+918045678930',
    hours: 'Mon–Fri, 10am–6pm',
  },
] as const;

export const offices = [
  {
    city: 'Bengaluru',
    tag: 'HQ',
    address:
      '2nd Floor, Plot No 190/108/2, Haralur Main Rd, opposite Narayana Olympiad School, HSR Extension, Lakedew Residency, 560102',
  },
  { city: 'Hyderabad', tag: 'Launching 2026', address: 'Madhapur, HITEC City' },
  { city: 'Chennai', tag: 'Coming soon', address: 'Tidel Park, Taramani' },
] as const;

export const contactSubjects = [
  'Order issue',
  'Refund request',
  'Pharmacy partnership',
  'Press inquiry',
  'Something else',
] as const;
