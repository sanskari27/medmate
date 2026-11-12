import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";

const SAFE_BODY = "Save invoice settings?";
const REVIEW_BODY =
  "A signature change is sent for review. You will not be able to use the console until the pharmacy is approved again.";

export function SaveConfirm({
  review,
  saving,
  error,
  onCancel,
  onConfirm,
}: {
  review: boolean;
  saving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Box className="fixed inset-0 z-[100] grid place-items-center bg-[#10301d66] p-6">
      <Stack
        role="dialog"
        aria-labelledby="invoice-save-title"
        className="w-full max-w-[420px] gap-3 rounded-lg bg-paper p-5 shadow-pop"
      >
        <Heading id="invoice-save-title" level={3}>
          Save invoice settings?
        </Heading>
        <Text>{review ? REVIEW_BODY : SAFE_BODY}</Text>
        {error ? <Text className="text-[13px] font-bold text-rose">{error}</Text> : null}
        <Stack direction="row" justify="end" gap={2}>
          <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={onConfirm}>
            Save
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
