import { LegalDocument } from '@/components/site/LegalDocument';
import { refundPolicy } from '@/content/pages/legal';

export function RefundPage() {
  return (
    <LegalDocument
      title={refundPolicy.title}
      lastUpdated={refundPolicy.lastUpdated}
      sections={refundPolicy.sections}
    />
  );
}

export default RefundPage;
