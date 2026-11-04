import { PlusIcon } from '@/components/icons/PlusIcon';
import { faq } from '@/content/landing/site';

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="nl-faq">
      <summary>
        {question}
        <span className="plus">
          <PlusIcon />
        </span>
      </summary>
      <div className="nl-faq-body">{answer}</div>
    </details>
  );
}

export function FaqSection() {
  return (
    <section className="nl-sec" style={{ background: '#fff' }}>
      <div className="nl-wrap">
        <div className="nl-sec-head">
          <span className="nl-eyebrow" style={{ justifyContent: 'center' }}>
            Questions
          </span>
          <h2>Everything you might ask</h2>
        </div>
        <div className="nl-faq-wrap">
          {faq.map((item) => (
            <FaqItem key={item.q} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </section>
  );
}
