export const pharmacyOwnerMeta = {
  title: 'For Pharmacies · Early Access | Namma MedMate Bengaluru',
} as const;

export const pharmacyOwnerAnnounce = {
  before: 'Early access is open across ',
  city: 'Bengaluru',
  after: ' — set up your pharmacy now, be ready to ',
  link: 'sell online at launch →',
} as const;

export const pharmacyOwnerHero = {
  eyebrow: 'For pharmacies · Early access open',
  headlineBefore: 'Run your pharmacy today. ',
  headlineEm: 'Sell online the day we launch.',
  subBefore: 'Set up ',
  subBold1: 'GST billing, inventory, CRM and hospital credit',
  subMid:
    ' now — the management console is ready to use today. Online selling with home delivery is ',
  subBold2: 'launching in Bengaluru soon',
  subAfter: ', and early-access partners go live the moment it opens.',
  statusBold: 'Online store & home delivery are not live yet.',
  statusRest:
    ' They launch in Bengaluru soon — join early access now so your shop is ready and first in line.',
  stats: [
    { value: 'Free', label: 'to get started', gold: false },
    { value: '<7 days', label: 'to set up your console', gold: false },
    { value: 'Coming soon', label: 'online selling · Bengaluru', gold: true },
  ],
  primaryCta: 'Join early access',
  secondaryCta: "What's included",
  imageAlt: 'A local pharmacist at their neighbourhood chemist shop',
  badgeTitle: 'Now onboarding',
  badgeSub: 'across Bengaluru',
} as const;

export const pharmacyOwnerStatus = {
  eyebrow: 'Clear and simple',
  heading: "What you can use today — and what's coming",
  intro:
    "No confusion. Here's exactly where things stand, so you know what switches on now and what arrives at launch.",
  now: {
    title: 'Available now',
    badge: '● Live today',
    sub: 'Your full pharmacy management console — set up in about 7 days and use from day one.',
    items: [
      { title: 'GST billing & POS', detail: 'fast, compliant counter billing' },
      {
        title: 'Inventory & stock alerts',
        detail: 'stock-expiry & restocking notifications, batch-wise',
      },
      {
        title: 'Purchases & reorder',
        detail: 'distributor bills, one-tap POs',
      },
      { title: 'CRM · patients', detail: 'refill reminders & follow-ups' },
      {
        title: 'Hospital & ward credit',
        detail: 'khata, statements, ageing',
      },
      { title: 'Reports & GST filing', detail: 'P&L ready for your CA' },
    ],
  },
  soon: {
    title: 'Launching soon',
    badge: '◷ Not live yet',
    sub: 'Online selling arrives with the Namma MedMate customer app in Bengaluru. Set it up now; switch it on the day it launches.',
    items: [
      {
        title: 'Your online storefront',
        detail:
          'Your shop, listed in the Namma MedMate customer app — no website to build.',
      },
      {
        title: 'Home-delivery orders',
        detail:
          'Nearby customers order; you accept at your counter and dispatch.',
      },
      {
        title: 'Rider network',
        detail:
          'Use your own delivery staff or shared Namma riders, with OTP handover.',
      },
      {
        title: 'Online sales analytics',
        detail:
          'Track online vs counter sales, top online categories and repeat buyers.',
      },
    ],
  },
} as const;

export const pharmacyOwnerConsole = {
  eyebrow: 'Available now · the console',
  heading: 'One console for the whole shop',
  intro:
    'Everything a modern chemist needs to run the counter — no add-ons, no new hardware, GST-ready from day one, on desktop, tablet and phone.',
  features: [
    {
      icon: 'invoice',
      title: 'GST billing & POS',
      body: 'Fast counter billing with correct CGST/SGST splits, printable and WhatsApp-shareable invoices, and loose-strip selling. Barcode or batch scan pins the exact expiry and price on every line.',
    },
    {
      icon: 'inventory',
      title: 'Inventory & stock alerts',
      body: 'Batch-wise inventory with FEFO dispensing and automatic stock-expiry and restocking notifications — near-expiry batches and low-stock items are flagged in advance, so you reorder in time and nothing lapses on the shelf.',
    },
    {
      icon: 'purchase',
      title: 'Purchases & reorder',
      body: 'Enter a distributor bill and stock updates itself while input-GST credit is tracked. Low-stock lists group by distributor into ready-to-send purchase orders.',
    },
    {
      icon: 'patients',
      title: 'CRM · patients',
      body: 'Every customer and prescription on file. Refill reminders and chronic-care follow-ups quietly bring patients back — every sale becomes a relationship.',
    },
    {
      icon: 'hospital',
      title: 'Hospital & ward credit',
      body: 'Run khata for hospitals, wards and regulars with statements, ageing and settlements — no more chasing institutional payments on paper.',
    },
    {
      icon: 'chart',
      title: 'Reports & GST filing',
      body: 'Daily sales, profit, dead-stock and a ready GST P&L you can share straight to your CA — the whole shop at a glance on desktop, tablet or phone.',
    },
  ],
} as const;

export const pharmacyOwnerOnline = {
  eyebrow: 'Coming soon · online selling',
  heading: 'Your neighbourhood, ordering from you',
  intro:
    "When Namma MedMate opens to shoppers in Bengaluru, your pharmacy is already online. Here's how it will work — set it all up now, go live the day we launch.",
  steps: [
    {
      num: '1',
      title: "You're listed",
      body: 'The day we launch in your area, your shop appears in the customer app with your live stock and prices — nothing more to set up.',
    },
    {
      num: '2',
      title: 'Orders reach your counter',
      body: 'A nearby customer places an order; it lands in your console. You review, bill it with one tap, and pack it.',
    },
    {
      num: '3',
      title: 'A rider delivers',
      body: 'Hand it to your own runner or a Namma rider. Live tracking and an OTP handover on every order.',
    },
    {
      num: '4',
      title: 'You keep the relationship',
      body: 'The customer, the margin and the sale stay yours — and they come back to the chemist they already trust.',
    },
  ],
  tags: [
    { icon: 'clock', label: 'Launching in Bengaluru soon' },
    { icon: 'check', label: 'No website to build' },
    { icon: 'check', label: 'You keep your margins' },
  ],
} as const;

export const pharmacyOwnerOnboard = {
  eyebrow: 'How you get started',
  heading: 'Set up now. Go live at launch.',
  intro:
    'We do the heavy lifting — verification, data migration and training — so your counter runs today and your storefront is ready the moment online selling opens.',
  steps: [
    {
      num: '1',
      title: 'Join early access',
      body: 'A free 20-minute WhatsApp or on-site walkthrough. We map your shop, stock and billing needs — at no cost to you.',
    },
    {
      num: '2',
      title: 'We set up your console',
      body: 'Your catalogue, GST details and staff logins go live in about 7 days. We migrate your existing stock and distributor list for you.',
    },
    {
      num: '3',
      title: 'Run the counter today',
      body: 'Start billing, tracking inventory, managing credit and building your patient CRM straight away — the management side works from day one.',
    },
    {
      num: '4',
      title: 'Go live at launch',
      body: "When online selling opens in Bengaluru, your storefront switches on the same day — you're already set up and first in line.",
    },
  ],
} as const;

export const pharmacyOwnerWhyNow = {
  eyebrow: 'Why get in early',
  heading: 'The case for joining now',
  items: [
    {
      icon: 'zap',
      title: 'Be first in your area',
      body: 'Only a limited number of pharmacies go live per neighbourhood at launch. Early-access partners are listed before anyone else nearby.',
    },
    {
      icon: 'shield',
      title: 'No risk to try',
      body: "Free to start, no lock-in and no revenue share. Use the management console now; switch on online selling only when you're ready.",
    },
    {
      icon: 'store',
      title: 'Keep customers close',
      body: 'Big apps pull your customers to warehouses. This keeps them ordering from you — the chemist who already knows their name.',
    },
  ],
} as const;

export const pharmacyOwnerPricingCopy = {
  eyebrow: 'Simple pricing',
  heading: 'First 3 months free. No setup fee. No revenue share.',
  introBefore: 'Start on the management console today. Features marked ',
  introMark: '(at launch)',
  introAfter:
    ' switch on when online selling goes live in Bengaluru — at no extra cost. Cancel any time.',
  cta: 'Join early access',
  customCta: 'Get a custom quote',
} as const;

export const pharmacyOwnerCoverage = {
  eyebrow: "Where we're starting",
  heading: 'Bengaluru first, more cities soon',
  introBefore: 'Online selling launches across ',
  introBold: '1,180+ Bengaluru pin codes',
  introAfter:
    ' in six zones — with new cities opening after. Onboarding for the management console is open across all of them now.',
  soonLabel: 'Cities coming soon',
  cities: ['Hyderabad', 'Chennai', 'Mumbai', 'Pune', 'Delhi NCR'],
} as const;

export const pharmacyOwnerDemo = {
  eyebrow: 'Join early access',
  heading: 'Get set up — and be first to sell online',
  introBefore: 'Leave your details and our team will reach out within ',
  introBold: '1 business day',
  introAfter:
    ' to set up your free console walkthrough and add you to the launch list.',
  points: [
    { icon: 'check', text: 'Free to start · no lock-in · cancel anytime' },
    { icon: 'check', text: 'Management console live in under 7 days' },
    {
      icon: 'clock',
      text: 'Online selling switches on at launch — first in line',
    },
  ],
  fields: {
    name: { label: 'Your name', placeholder: 'Ramesh Kumar' },
    pharmacy: { label: 'Pharmacy name', placeholder: 'Sri Sai Medicals' },
    phone: { label: 'Phone', placeholder: '9xxxxxxxxx' },
    pincode: { label: 'Pin code', placeholder: '560102' },
    sales: {
      label: 'Approx. monthly counter sales',
      placeholder: 'Select a range',
    },
  },
  salesRanges: ['Under ₹2 lakh', '₹2 – 5 lakh', '₹5 – 10 lakh', '₹10 lakh+'],
  submit: 'Join early access',
  sending: 'Sending…',
  success:
    "Thanks — you're on the early-access list. We'll reach out within 1 business day.",
} as const;
