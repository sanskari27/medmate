import { brand } from '@/content/landing/site';

export const supportEmail = 'support@nammamedmate.com';

export const privacyPolicy = {
  title: 'Privacy Policy',
  lastUpdated: '11 August 2026',
  sections: [
    {
      heading: 'Who we are',
      paragraphs: [
        `This Privacy Policy explains how ${brand.legal} (“Namma MedMate”, “we”, “us”) collects, uses, and shares information when you use our websites, patient ordering experience, pharmacy console, and related services (together, the “Services”).`,
        `We operate from ${brand.location}. For privacy questions, contact us at ${supportEmail}.`,
      ],
    },
    {
      heading: 'Information we collect',
      paragraphs: [
        'Account and profile details such as name, phone number, email address, and (for pharmacies) business details including pharmacy name, address, GST-related identifiers, and contact persons.',
        'Order and fulfilment details such as prescription images or references, medicine lists, delivery addresses, preferred delivery windows, and status updates needed to complete an order.',
        'Technical and usage data such as device type, browser, approximate location derived from IP or delivery pin code, cookies or similar technologies, and logs that help us secure and improve the Services.',
        'Demo and support requests, including the information you submit in “Book a demo” or contact forms.',
      ],
    },
    {
      heading: 'How we use information',
      paragraphs: [
        'To provide hyperlocal medicine ordering, pharmacy console operations, delivery coordination, payments-related processing where applicable, and customer support.',
        'To verify prescriptions and comply with applicable pharmacy and controlled-medicine rules (including Schedule-H awareness in product flows).',
        'To communicate about orders, account changes, security alerts, and service updates.',
        'To improve reliability, prevent fraud or abuse, and analyse aggregated usage trends.',
        'To respond to demo, partnership, and support enquiries you send us.',
      ],
    },
    {
      heading: 'How we share information',
      paragraphs: [
        'With neighbourhood pharmacy partners and delivery partners only as needed to fulfil your order or operate the network.',
        'With service providers who host infrastructure, send communications, process payments, or provide analytics — under contracts that limit their use of your data.',
        'When required by law, regulation, court order, or to protect the rights, safety, or integrity of users and the Services.',
        'We do not sell your personal information.',
      ],
    },
    {
      heading: 'Retention',
      paragraphs: [
        'We retain information for as long as needed to provide the Services, meet legal and accounting obligations, resolve disputes, and enforce agreements. Retention periods vary by data type and regulatory need.',
      ],
    },
    {
      heading: 'Security',
      paragraphs: [
        'We use administrative, technical, and organisational measures appropriate to the sensitivity of the data. No method of transmission or storage is completely secure; please use strong credentials and protect your devices.',
      ],
    },
    {
      heading: 'Your choices',
      paragraphs: [
        'You may request access, correction, or deletion of personal information we hold about you, subject to legal exceptions (for example, records we must keep for compliance).',
        `Contact ${supportEmail} to exercise these choices or to ask privacy-related questions. We may need to verify your identity before fulfilling a request.`,
      ],
    },
    {
      heading: 'Children',
      paragraphs: [
        'The Services are not directed at children. If you believe a child has provided personal information, contact us and we will take appropriate steps.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'We may update this Privacy Policy from time to time. The “Last updated” date at the top will change when we do. Continued use of the Services after an update means you accept the revised policy.',
      ],
    },
  ],
} as const;

export const termsOfService = {
  title: 'Terms and Conditions',
  lastUpdated: '11 August 2026',
  sections: [
    {
      heading: 'Agreement',
      paragraphs: [
        `These Terms and Conditions (“Terms”) govern your use of websites and services operated by ${brand.legal} (“Namma MedMate”, “we”, “us”), including the patient ordering experience and the pharmacy partner console.`,
        `By accessing or using the Services, you agree to these Terms. If you do not agree, do not use the Services.`,
      ],
    },
    {
      heading: 'Who may use the Services',
      paragraphs: [
        'Patients and caregivers may use ordering features in accordance with applicable law and these Terms.',
        'Pharmacy partners must be licensed to operate a pharmacy in India and must provide accurate business and compliance information. Partner access may be suspended if credentials or conduct are incomplete or unlawful.',
      ],
    },
    {
      heading: 'Orders, prescriptions, and medicines',
      paragraphs: [
        'Medicine availability, pricing, and fulfilment times depend on the fulfilling pharmacy, stock, and local conditions. Stated delivery windows (including typical 12–30 minute neighbourhood delivery) are operational targets, not guaranteed service levels in every case.',
        'Prescription medicines require a valid prescription or an approved e-prescription / consult path where offered. You are responsible for providing accurate medical and prescription information.',
        'Namma MedMate coordinates technology and network logistics; medicines are dispensed by licensed pharmacies. We are not a substitute for professional medical advice.',
      ],
    },
    {
      heading: 'Pharmacy console',
      paragraphs: [
        'Pharmacy partners may use the console for inventory, billing, GST-related workflows, online order handling, and related operations as enabled for their account.',
        'Partners remain responsible for statutory compliance, correct GST treatment, Schedule-H and other controlled-medicine controls, and the accuracy of stock and billing data entered into the console.',
      ],
    },
    {
      heading: 'Accounts and acceptable use',
      paragraphs: [
        'Keep login credentials confidential. You are responsible for activity under your account.',
        'Do not misuse the Services, attempt unauthorised access, interfere with other users, upload unlawful content, or use the platform to circumvent pharmacy or controlled-substance regulations.',
      ],
    },
    {
      heading: 'Fees',
      paragraphs: [
        'Pharmacy console access may be offered free to start, with optional paid plans or network fees as communicated separately. Patient delivery or convenience fees, if any, will be shown before you confirm an order where applicable.',
      ],
    },
    {
      heading: 'Refunds and cancellations',
      paragraphs: [
        'Refund and cancellation handling depends on order status, medicine type, and the fulfilling pharmacy’s policies, subject to applicable law.',
        `See our Refund Policy for eligibility, processing timelines, and how to raise a request, or email ${supportEmail} with your order reference.`,
      ],
    },
    {
      heading: 'Intellectual property',
      paragraphs: [
        'The Services, branding, software, and content (excluding user-submitted content) are owned by Namma MedMate or its licensors. You receive a limited, non-exclusive right to use the Services as offered — not ownership of the underlying IP.',
      ],
    },
    {
      heading: 'Disclaimers and limitation of liability',
      paragraphs: [
        'Services are provided on an “as is” and “as available” basis to the fullest extent permitted by law.',
        'To the maximum extent permitted by applicable law, Namma MedMate is not liable for indirect, incidental, special, consequential, or punitive damages, or for loss of profits, data, or goodwill arising from use of the Services.',
        'Nothing in these Terms excludes liability that cannot be limited under Indian law.',
      ],
    },
    {
      heading: 'Governing law',
      paragraphs: [
        `These Terms are governed by the laws of India. Courts in ${brand.location} shall have exclusive jurisdiction, subject to mandatory consumer protections that apply to you.`,
      ],
    },
    {
      heading: 'Contact',
      paragraphs: [
        `Questions about these Terms: ${supportEmail}. ${brand.legal}, ${brand.location}.`,
      ],
    },
  ],
} as const;

export const refundPolicy = {
  title: 'Refund Policy',
  lastUpdated: '11 August 2026',
  sections: [
    {
      heading: 'Overview',
      paragraphs: [
        `This Refund Policy explains how cancellations and refunds work for orders placed through Namma MedMate Services operated by ${brand.legal}. It should be read with our Terms and Conditions.`,
        `For help with a specific order, email ${supportEmail} with your order reference, registered phone number, and a short description of the issue.`,
      ],
    },
    {
      heading: 'When you can cancel',
      paragraphs: [
        'You may request cancellation before the pharmacy has started preparing or dispatching your order. Once packing or delivery has begun, cancellation may no longer be possible.',
        'If an item is unavailable, the prescription cannot be verified, or delivery cannot be completed for reasons outside your control, we will work with the fulfilling pharmacy to cancel or adjust the order and process any refund due.',
      ],
    },
    {
      heading: 'Refund eligibility',
      paragraphs: [
        'Refunds are typically available when: payment was collected for an order that is cancelled before fulfilment; items are missing, incorrect, damaged, or expired on delivery (reported promptly with evidence where requested); or a failed delivery is confirmed and the medicines are returned to the pharmacy.',
        'Refunds are generally not available for successfully delivered orders that match the prescription or cart, for change-of-mind after dispatch where medicines cannot be restocked safely, or where applicable law or pharmacy regulations restrict return of certain medicines (including many prescription and temperature-sensitive items).',
      ],
    },
    {
      heading: 'How refunds are processed',
      paragraphs: [
        'Approved refunds are initiated to the original payment method where possible. Timing depends on the payment provider and your bank; please allow several business days after we confirm the refund.',
        'Partial refunds may apply when only some items in an order are cancelled, unavailable, or eligible for return.',
      ],
    },
    {
      heading: 'Delivery and convenience fees',
      paragraphs: [
        'Any delivery or convenience fee shown at checkout is refunded when the entire paid order is cancelled before fulfilment or fails for reasons not attributable to you. Fees may be non-refundable if a delivery attempt was completed as requested and the order was refused without a valid quality or fulfilment issue.',
      ],
    },
    {
      heading: 'Pharmacy partners',
      paragraphs: [
        'Medicines are dispensed by licensed neighbourhood pharmacies. Some refund decisions depend on the fulfilling pharmacy’s stock handling and regulatory constraints. Namma MedMate coordinates support and payment reversal where the network confirms eligibility.',
      ],
    },
    {
      heading: 'How to raise a request',
      paragraphs: [
        `Email ${supportEmail} or use in-app support (where available). Include order ID, date, pharmacy name if known, and photos for damaged, incorrect, or quality issues.`,
        'We aim to acknowledge refund requests promptly and will tell you the outcome once the pharmacy and payment status are checked.',
      ],
    },
    {
      heading: 'Changes',
      paragraphs: [
        'We may update this Refund Policy from time to time. The “Last updated” date will change when we do. Continued use of the Services after an update means you accept the revised policy.',
      ],
    },
  ],
} as const;
