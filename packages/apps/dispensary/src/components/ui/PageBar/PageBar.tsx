import { useEffect, useState, type FormEvent } from "react";
import { Box } from "../Box";
import { Button } from "../Button";
import { Input } from "../Input";
import { Text } from "../Text";

export function PageBar({
  page,
  size,
  total,
  onPage,
}: {
  page: number;
  size: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / Math.max(size, 1)));
  const start = total === 0 ? 0 : (Math.min(page, pages) - 1) * size + 1;
  const end = total === 0 ? 0 : Math.min(page * size, total);
  const [draft, setDraft] = useState(String(page));
  const only = pages <= 1;

  useEffect(() => {
    setDraft(String(page));
  }, [page]);

  function jump(event?: FormEvent) {
    event?.preventDefault();
    const next = Number(draft);
    if (!Number.isInteger(next) || next < 1 || next > pages) {
      setDraft(String(page));
      return;
    }
    if (next !== page) onPage(next);
  }

  return (
    <Box className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
      <Text className="text-[13px] text-muted">{`${start}–${end} of ${total}`}</Text>
      <Box className="flex items-center gap-2">
        <form onSubmit={jump} className="flex items-center gap-2">
          <Text as="span" className="text-[13px] text-muted">
            Page
          </Text>
          <Input
            aria-label="Page"
            inputMode="numeric"
            value={draft}
            onChange={(event) => setDraft(event.target.value.replace(/\D/g, ""))}
            onBlur={() => jump()}
            className="w-16 text-center"
            controlSize="sm"
          />
          <Text as="span" className="text-[13px] text-muted">{`of ${pages}`}</Text>
        </form>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={only || page <= 1}
          onClick={() => onPage(page - 1)}
        >
          Previous
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={only || page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
