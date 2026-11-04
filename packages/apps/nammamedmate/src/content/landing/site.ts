/**
 * Landing-site content shared by the page sections and legal documents.
 * strings for legal pages and any remaining shared chrome.
 */

export const brand = {
  name: 'Namma MedMate',
  legal: 'Medmate India Technology Private Limited',
  location: 'Bengaluru, Karnataka',
  tagline: 'Partner Console',
} as const;

/** Canonical landing navigation links (dedicated secondary routes) */
export const navLinks = [
  { label: 'Pharmacy Owner', href: '/pharmacy-owner' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'Stories', href: '/stories' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
] as const;

export const metrics = {
  partners: '750+',
  pinCodes: '1,180+',
} as const;

export const coverageAreas = [
  {
    region: 'South Bengaluru',
    pinCodes: '245 pin codes',
    neighborhoods:
      'Koramangala · Jayanagar · JP Nagar · BTM Layout · Banashankari · Basavanagudi · Kanakapura Road · Bannerghatta Road · Uttarahalli · Padmanabhanagar · Hulimavu · Bommanahalli · HSR Layout · Kudlu Gate · Electronic City',
  },
  {
    region: 'East Bengaluru',
    pinCodes: '260 pin codes',
    neighborhoods:
      'Indiranagar · Domlur · CV Raman Nagar · Marathahalli · Bellandur · Sarjapur Road · Whitefield · Brookefield · Hoodi · KR Puram · Mahadevapura · Kadugodi · Varthur · Doddanekundi · Ramamurthy Nagar · HAL',
  },
  {
    region: 'North Bengaluru',
    pinCodes: '215 pin codes',
    neighborhoods:
      'Hebbal · Yelahanka · RT Nagar · Sahakara Nagar · Vidyaranyapura · Jakkur · Thanisandra · Nagawara · Hennur · Kalyan Nagar · Kammanahalli · Banaswadi · Horamavu · HBR Layout · Jalahalli · Yeshwanthpur',
  },
  {
    region: 'West Bengaluru',
    pinCodes: '175 pin codes',
    neighborhoods:
      'Rajajinagar · Vijayanagar · Malleshwaram · Basaveshwaranagar · Nagarbhavi · Rajarajeshwari Nagar · Kengeri · Nandini Layout · Mahalakshmi Layout · Magadi Road · Chandra Layout · Attiguppe · Girinagar',
  },
  {
    region: 'Central Bengaluru',
    pinCodes: '120 pin codes',
    neighborhoods:
      'MG Road · Brigade Road · Ulsoor · Shivajinagar · Frazer Town · Cox Town · Richmond Town · Cunningham Road · Sadashivanagar · Seshadripuram · Wilson Garden · Shanti Nagar · Chickpet',
  },
  {
    region: 'Greater Bengaluru',
    pinCodes: '165 pin codes',
    neighborhoods:
      'Devanahalli · Hoskote · Anekal · Chandapura · Attibele · Nelamangala · Bidadi · Doddaballapur · Sarjapur',
  },
] as const;

export const pricing = {
  intro:
    'First 3 months free on every plan. No setup fee, no lock-in — upgrade or cancel any time, and your data always stays yours.',
  yearlySaveLabel: 'Save up to ₹3,600/yr',
  plans: [
    {
      name: 'Essential',
      monthly: 299,
      yearlyOff: 50,
      popular: false,
      desc: 'Your shop, online — the essentials, done right.',
      feats: [
        'Business dashboard',
        'Billing & GST invoices',
        'Sales history',
        'Inventory · stock-expiry & restocking alerts',
        'Purchase entry',
        'Online store (at launch)',
        '2 user logins',
      ],
    },
    {
      name: 'Care',
      monthly: 499,
      yearlyOff: 100,
      popular: false,
      desc: 'Keep every patient close.',
      feats: [
        'Everything in Essential, plus:',
        'Prescriptions & customers',
        'Credit khata',
        'WhatsApp reminders & invoices',
        'Email support',
        'Up to 2 user logins',
      ],
    },
    {
      name: 'Growth',
      monthly: 999,
      yearlyOff: 200,
      popular: true,
      desc: 'Run and grow like a pro.',
      feats: [
        'Everything in Care, plus:',
        'Reports & insights',
        'CRM & CA sharing',
        'Reorder & distributors',
        'Up to 3 user logins',
      ],
    },
    {
      name: 'Flagship',
      monthly: 1499,
      yearlyOff: 300,
      popular: false,
      desc: 'The complete pharmacy, front to back.',
      feats: [
        'Everything in Growth, plus:',
        'Hospital billing & ward indents',
        'Self-order kiosk',
        'Rack & location',
        'Priority support',
        '3 – 4 user logins',
      ],
    },
  ],
} as const;

export const faq = [
  {
    q: 'How long does setup take?',
    a: 'Most pharmacies are live in about 7 days. We migrate your existing stock, distributor list and GST details, then train your staff on WhatsApp or on-site.',
  },
  {
    q: 'Do I need to buy new hardware?',
    a: 'No. The console runs on any laptop, tablet or phone you already have — desktop for the full ERP, tablet at the counter, phone on the move. A basic thermal printer is all you need for bills.',
  },
  {
    q: 'Is my data safe and GST-compliant?',
    a: "Yes. Invoices are GST-ready, data is encrypted and backed up, and you can export everything any time. We're building toward ISO 27001 and DPDP-Act compliance.",
  },
  {
    q: 'Can I keep my current suppliers?',
    a: 'Absolutely. Namma MedMate manages your purchases, batches and reorders with your existing distributors — plus one-tap reorder when stock runs low.',
  },
  {
    q: 'What does the online store cost me?',
    a: "Nothing extra — the online store is included in your plan. It's launching soon in Bengaluru: set up your console now and your shop goes live online the day it opens. Orders come to your counter, you keep your margins, and the sale stays yours.",
  },
  {
    q: 'How does delivery work?',
    a: "Delivery is coming soon. When it launches you'll assign your own staff or tap the shared Namma rider network, with live tracking and OTP handover on every order — typically to the door in about 30 minutes.",
  },
  {
    q: 'Which areas do you cover?',
    a: "We're onboarding chemists across all of Bengaluru — south, east, north, west, central and greater Bengaluru — expanding across Karnataka through 2026. Book a demo and we'll tell you your area's status.",
  },
] as const;

/** Kept for SiteFooter compatibility if referenced elsewhere */
export const footer = {
  blurb:
    'Your neighbourhood pharmacy, upgraded — one console for billing, inventory, CRM and credit today, with an online store and delivery launching soon.',
  columns: [
    {
      title: 'Product',
      links: [
        { label: 'Features', href: '/#features' },
        { label: 'The console', href: '/#console' },
        { label: "How we're different", href: '/#different' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'Customer stories', href: '/stories' },
        { label: 'Partners', href: '/contact' },
      ],
    },
    {
      title: 'For pharmacies',
      links: [
        { label: 'Become a partner', href: '/pharmacy-owner' },
        { label: 'Partner pricing', href: '/pharmacy-owner#pricing' },
        { label: 'Book a demo', href: '/pharmacy-owner#demo' },
        { label: 'Demo dashboard', href: '/assets/pharmacy-console' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Contact', href: '/contact' },
        { label: 'Patient App', href: 'https://app.nammamedmate.com/' },
      ],
    },
  ],
} as const;
