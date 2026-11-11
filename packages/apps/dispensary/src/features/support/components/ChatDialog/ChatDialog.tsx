import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { SupportDialog } from "../SupportDialog";

const fieldLabel = "text-[11.5px] font-bold tracking-wide text-ink-2";

export function ChatDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (subject: string) => void;
}) {
  const [subject, setSubject] = useState("");
  return (
    <SupportDialog title="Start a chat" onClose={onClose}>
      <Field label={<span className={fieldLabel}>Subject</span>}>
        <Input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="What do you need help with?"
        />
      </Field>
      <Box className="mt-4 flex justify-end gap-2.5">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!subject.trim()} onClick={() => onSubmit(subject.trim())}>
          Open chat
        </Button>
      </Box>
    </SupportDialog>
  );
}
