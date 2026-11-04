export type StoryTab =
  'all' | 'independent' | 'hospital' | 'multibranch' | 'online';

export type Story = {
  id: string;
  tab: Exclude<StoryTab, 'all'>;
  avatar: string;
  type: string;
  title: string;
  challenge: string;
  uses: string[];
};

export const storyTabs: { id: StoryTab; label: string }[] = [
  { id: 'all', label: 'All stories' },
  { id: 'independent', label: 'Independent chemist' },
  { id: 'hospital', label: 'Hospital pharmacy' },
  { id: 'multibranch', label: 'Multi-branch' },
  { id: 'online', label: 'Getting online-ready' },
];

export const stories: Story[] = [
  {
    id: 'nc',
    tab: 'independent',
    avatar: 'NC',
    type: 'Independent chemist',
    title: 'One counter, finally organised',
    challenge:
      'A single person at the counter, a paper register, and expiry write-offs quietly eating into already-thin margins.',
    uses: [
      'Fast GST billing & POS',
      'Expiry & restock alerts before stock lapses',
      'Credit khata for regulars',
      'Customers & prescriptions on file',
    ],
  },
  {
    id: 'cr',
    tab: 'independent',
    avatar: 'CR',
    type: 'Chronic-care pharmacy',
    title: 'Refills that never slip',
    challenge:
      'Regulars on long-term medication who forget to reorder — and walk to another shop when the strip runs out.',
    uses: [
      'Refill reminders & follow-ups',
      'Patient CRM with history',
      'One-tap reorder from past bills',
      'Loyalty that brings patients back',
    ],
  },
  {
    id: 'hw',
    tab: 'hospital',
    avatar: 'HW',
    type: 'Hospital & ward pharmacy',
    title: 'No more chasing ward payments',
    challenge:
      'Hospital and ward credit tracked on paper, indents scattered across registers, statements always late.',
    uses: [
      'Ward & hospital credit (khata)',
      'Automatic statements & settlements',
      'Bed maps and ward indents',
      'Batch & expiry tracking',
    ],
  },
  {
    id: 'mb',
    tab: 'multibranch',
    avatar: 'MB',
    type: 'Multi-branch owner',
    title: 'Three shops, one dashboard',
    challenge:
      'Several branches with no single view of stock, sales or which shop is about to run short of a fast mover.',
    uses: [
      'One dashboard across branches',
      'Stock transfers between shops',
      'Reports, profit & GST-ready P&L',
      'Role-based logins per branch',
    ],
  },
  {
    id: 'on',
    tab: 'online',
    avatar: 'ON',
    type: 'Getting online-ready',
    title: 'First in line to sell online',
    challenge:
      'Wants to take orders from the neighbourhood — and be live the very day online selling opens in Bengaluru.',
    uses: [
      'Set up the console today',
      'Online store under your own name (at launch)',
      'Rider network for delivery (coming soon)',
      'Go live the day it opens',
    ],
  },
];
