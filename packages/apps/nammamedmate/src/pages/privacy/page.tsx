import { LegalDocument } from '@/components/site/LegalDocument';
import { privacyPolicy } from '@/content/pages/legal';

export function PrivacyPage() {
  return (
    <LegalDocument
      title={privacyPolicy.title}
      lastUpdated={privacyPolicy.lastUpdated}
      sections={privacyPolicy.sections}
    />
  );
}

export default PrivacyPage;
