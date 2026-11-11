import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { TICKET_CATEGORIES } from "../../model";
import { SupportDialog } from "../SupportDialog";

const fieldLabel = "text-[11.5px] font-bold tracking-wide text-ink-2";

export function TicketDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (subject: string, category: string, details: string) => void;
}) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<string>(TICKET_CATEGORIES[0]);
  const [details, setDetails] = useState("");
  return (
    <SupportDialog title="Raise a support ticket" onClose={onClose}>
      <Field label={<span className={fieldLabel}>Subject</span>}>
        <Input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="Briefly describe the issue"
        />
      </Field>
      <Field label={<span className={fieldLabel}>Category</span>}>
        <select
          aria-label="Category"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink"
        >
          {TICKET_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </Field>
      <Field label={<span className={fieldLabel}>Details</span>}>
        <textarea
          aria-label="Details"
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          placeholder="Tell us what happened…"
          className="min-h-16 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink"
        />
      </Field>
      <Box className="mt-4 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          disabled={!subject.trim()}
          onClick={() => onSubmit(subject.trim(), category, details)}
        >
          Submit ticket
        </Button>
      </Box>
    </SupportDialog>
  );
}
