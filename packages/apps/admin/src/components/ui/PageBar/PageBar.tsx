import { Box } from "../Box";
import { Button } from "../Button";
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
  const only = pages <= 1;
  return (
    <Box className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
      <Text className="text-[13px] text-muted">{`page ${page} of ${pages}`}</Text>
      <Box className="flex gap-2">
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
