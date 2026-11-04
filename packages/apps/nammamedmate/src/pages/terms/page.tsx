import { LegalDocument } from '@/components/site/LegalDocument';
import { termsOfService } from '@/content/pages/legal';

export function TermsPage() {
  return (
    <LegalDocument
      title={termsOfService.title}
      lastUpdated={termsOfService.lastUpdated}
      sections={termsOfService.sections}
    />
  );
}

export default TermsPage;
