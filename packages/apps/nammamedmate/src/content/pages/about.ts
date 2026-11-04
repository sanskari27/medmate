export const aboutValues = [
  {
    title: 'Local first',
    body: 'Every order goes to a chemist within 2 km. We back the trusted neighbourhood shop, never a faraway warehouse.',
    icon: 'location',
  },
  {
    title: 'Honest by default',
    body: 'No medicine markups, no dark patterns, no fake reviews. Delivery is free if we’re late — and any chemist who marks up is removed.',
    icon: 'shield',
  },
  {
    title: 'Built in India',
    body: 'Our team, our servers and our chemists are all Indian. We pay our taxes in Bengaluru and hire locally.',
    icon: 'check',
  },
  {
    title: 'Empathy at the door',
    body: 'We hire for kindness first. The person at the door understands that behind every order is someone who needs their medicine.',
    icon: 'heart',
  },
] as const;

export const team = [
  {
    initials: 'RP',
    name: 'Roni Paul',
    role: 'CEO & Founder · Serial entrepreneur · Astana Medical University, MBBS drop-out',
  },
  {
    initials: 'SA',
    name: 'Dr Sri Hari Alapati',
    role: 'Advisor · Pediatrician · Founder, Revive Hospitals',
  },
  { initials: 'RS', name: 'Reyansh Sharma', role: 'CTO' },
  { initials: 'AR', name: 'Akash Raj', role: 'CDM' },
  {
    initials: 'HG',
    name: 'Heemashree Gogoi',
    role: 'Head of Pharmacy · Licensed pharmacist',
  },
] as const;

export const companyInformation = [
  { label: 'Entity', value: 'Medmate India Technology Private Limited' },
  { label: 'CIN', value: 'U72900KA2026PTC170001' },
  {
    label: 'Registered office',
    value:
      '2nd Floor, Plot No 190/108/2, Haralur Main Rd, opposite Narayana Olympiad School, HSR Extension, Lakedew Residency, Bengaluru, Karnataka 560102',
  },
  { label: 'Drug licences', value: 'Form 20B and 21B (KA/BLR)' },
] as const;

export const founderStory = {
  intro: [
    'For our founder, Roni Paul, Namma MedMate was never a business idea first. It began at home, with his father.',
    'His father lives with diabetes. If you have cared for someone who does, you know it isn’t one big emergency — it’s a hundred small, unforgiving routines. The morning tablet. The insulin kept cold. The test strips that have to be there before breakfast. There is no “I’ll get it tomorrow.” Miss a single day and a manageable condition can quietly turn into a hospital bed.',
    'Roni grew up close enough to medicine to enrol in an MBBS programme at Astana Medical University. But the lesson that stayed with him didn’t come from a lecture hall. It came from ordinary Sunday mornings at home — watching his father stretch a nearly empty box of strips to make it last one more day, quietly rationing his own health so as not to be a bother to anyone.',
  ],
  details: [
    'And Roni watched himself do the frustrating dance every Indian family knows too well. App after app showing “out of stock.” Chemists who had the medicine but wouldn’t deliver. A forty-minute drive across Bengaluru, shop to shop, for a single strip of tablets that should have taken ten minutes to reach the door.',
    'That was the part that stung. Right around the corner stood a chemist his family had trusted for years — a shop that had everything his father needed. But it had no way to take an order over the phone, no way to show what was in stock, and no way to send it the short distance home. The gap wasn’t kilometres. It was software.',
    'The big platforms had solved delivery, but only for their own warehouses — not for the neighbourhood chemist who actually knew your name and your prescription. Roni realised the answer wasn’t one more faceless pharmacy app. It was giving the corner shop the same technology the giants had, and connecting it to the families living just a few streets away.',
    'Roni didn’t go straight from that frustration to a solution. He had left medical school years earlier — not for this, but to build. In the years that followed he started and ran businesses across very different industries, learning the unglamorous craft that no lecture ever teaches: how to turn an idea into something real, how to ship technology that people actually use, how to hire and lead a team, and how to earn a customer’s trust one hard day at a time.',
    'When the same problem with his father’s medicines kept repeating, all of that experience finally found its purpose. The frustration was deeply personal — but the ability to actually fix it came from years of building companies, stumbling, and learning what it really takes to make something work. Namma MedMate is the result of both: a founder who has lived the problem himself, with the hard-won experience to solve it.',
    'That’s what Namma MedMate does today. It gives every neighbourhood chemist an online store, GST billing, live inventory and a delivery network — and gives every family a way to get genuine medicine to their door in about 30 minutes.',
    'We measure success in something simpler than orders. It’s a father who never has to ration his strips again. It’s a daughter who doesn’t lose her Sunday to a pharmacy crawl. It’s the corner chemist — still standing, still trusted, now open to the whole neighbourhood. That’s why we started, and it’s why we keep going.',
  ],
  quote:
    'The medicine was never far away. It was sitting on a shelf around the corner. What was missing was a way to carry it those last few hundred metres.',
} as const;
