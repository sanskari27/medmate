import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Switch } from "@/components/ui/Switch";
import { Text } from "@/components/ui/Text";
import { problemMessage } from "../../problemMessage";
import { statusLabel, type Faq, type SupportCase } from "../../model";
import {
  useCasesQuery,
  useCreateFaqMutation,
  useFaqsQuery,
  useReorderFaqsMutation,
  useUpdateFaqMutation,
} from "../../support.api";
import { useSupportStream } from "../../useSupportStream";

export function SupportPage() {
  useSupportStream();
  const faqs = useFaqsQuery();
  const cases = useCasesQuery();
  const [createFaq] = useCreateFaqMutation();
  const [updateFaq] = useUpdateFaqMutation();
  const [reorder] = useReorderFaqsMutation();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const failure = faqs.error ?? cases.error;
  const items = faqs.data ?? [];

  async function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= items.length) return;
    const ids = items.map((item) => item.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(next, 0, moved);
    await reorder(ids);
  }

  if (faqs.isLoading || cases.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading support</Text>;
  }

  return (
    <Stack className="gap-8">
      {failure ? (
        <Text className="text-[13.5px] font-bold text-rose">
          {problemMessage(failure, "Could not load support")}
        </Text>
      ) : null}
      <section className="grid gap-3">
        <Stack direction="row" align="center" className="justify-between gap-3">
          <Heading level={2} className="text-[18px]">
            FAQs
          </Heading>
          <Button size="sm" onClick={() => setAdding(true)}>
            Add FAQ
          </Button>
        </Stack>
        {items.length === 0 ? <Text className="text-muted">No FAQs yet.</Text> : null}
        {items.map((faq, index) => (
          <article
            key={faq.id}
            className="grid gap-3 rounded-lg border border-line bg-paper px-4 py-3.5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <Text className="text-[15px] font-bold text-dark">{faq.question}</Text>
            <span className="flex flex-wrap items-center gap-2 sm:justify-end">
              <Switch
                checked={faq.published}
                label={faq.published ? `Hide ${faq.question}` : `Publish ${faq.question}`}
                onClick={() =>
                  void updateFaq({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    published: !faq.published,
                  })
                }
              />
              <Button variant="ghost" size="sm" onClick={() => setEditing(faq)}>
                Edit
              </Button>
              <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => void move(index, -1)}>
                Move up
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={index === items.length - 1}
                onClick={() => void move(index, 1)}
              >
                Move down
              </Button>
            </span>
          </article>
        ))}
      </section>
      <section className="grid gap-3">
        <Heading level={2} className="text-[18px]">
          Cases
        </Heading>
        {(cases.data ?? []).length === 0 ? <Text className="text-muted">No cases yet.</Text> : null}
        {(cases.data ?? []).map((item) => (
          <CaseRow key={item.id} item={item} />
        ))}
      </section>
      {adding ? (
        <FaqDialog
          title="Add FAQ"
          onClose={() => setAdding(false)}
          onSave={async (question, answer) => {
            await createFaq({ question, answer }).unwrap();
            setAdding(false);
          }}
        />
      ) : null}
      {editing ? (
        <FaqDialog
          title="Edit FAQ"
          question={editing.question}
          answer={editing.answer}
          onClose={() => setEditing(null)}
          onSave={async (question, answer) => {
            await updateFaq({
              id: editing.id,
              question,
              answer,
              published: editing.published,
            }).unwrap();
            setEditing(null);
          }}
        />
      ) : null}
    </Stack>
  );
}

function CaseRow({ item }: { item: SupportCase }) {
  return (
    <Link
      to={`/support/cases/${item.id}`}
      className="grid gap-2 rounded-lg border border-line bg-paper px-4 py-3.5 hover:border-mid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
    >
      <span className="min-w-0">
        <Text className="truncate text-[15px] font-bold text-dark">{item.subject}</Text>
        <Text variant="muted" className="mt-0.5">
          {item.ticketNumber} · {item.pharmacyName || "Pharmacy"} · {item.category}
        </Text>
      </span>
      <span className="flex flex-wrap items-center gap-2 sm:justify-end">
        <Text as="span" className="rounded-full bg-wash px-2.5 py-1 text-[11px] font-bold text-dark uppercase">
          {statusLabel(item.status)}
        </Text>
        <Text as="span" variant="muted">
          {item.assigneeName || "Unassigned"}
        </Text>
      </span>
    </Link>
  );
}

function FaqDialog({
  title,
  question = "",
  answer = "",
  onClose,
  onSave,
}: {
  title: string;
  question?: string;
  answer?: string;
  onClose: () => void;
  onSave: (question: string, answer: string) => Promise<void>;
}) {
  const [nextQuestion, setQuestion] = useState(question);
  const [nextAnswer, setAnswer] = useState(answer);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-6">
      <form
        role="dialog"
        aria-label={title}
        className="grid w-full max-w-[540px] gap-3 rounded-lg bg-paper p-5"
        onSubmit={(event) => {
          event.preventDefault();
          void onSave(nextQuestion.trim(), nextAnswer.trim());
        }}
      >
        <Heading level={3}>{title}</Heading>
        <Field label="Question">
          <Input
            aria-label="Question"
            value={nextQuestion}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </Field>
        <Field label="Answer">
          <textarea
            aria-label="Answer"
            value={nextAnswer}
            onChange={(event) => setAnswer(event.target.value)}
            className="min-h-20 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink"
          />
        </Field>
        <span className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!nextQuestion.trim() || !nextAnswer.trim()}>
            Save
          </Button>
        </span>
      </form>
    </div>
  );
}
