import { Button } from "@/components/ui/Button";
import { IconCheck } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";

export function SaveBar({
  dirty,
  onDiscard,
  onSave,
}: {
  dirty: boolean;
  onDiscard: () => void;
  onSave: () => void;
}) {
  return (
    <Stack
      direction="row"
      align="center"
      justify="center"
      wrap
      className="gap-2.5 border-t border-line pt-4"
    >
      {dirty ? (
        <Text as="span" variant="caption">
          Unsaved changes
        </Text>
      ) : null}
      <Button type="button" variant="ghost" disabled={!dirty} onClick={onDiscard}>
        Discard
      </Button>
      <Button type="button" disabled={!dirty} onClick={onSave}>
        <IconCheck size={16} /> Save changes
      </Button>
    </Stack>
  );
}
