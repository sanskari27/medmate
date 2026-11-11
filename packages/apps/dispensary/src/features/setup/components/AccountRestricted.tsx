import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";

export function AccountRestricted() {
  return (
    <Stack className="gap-4">
      <Stack className="gap-1">
        <Heading level={2}>Your account is restricted.</Heading>
        <Text className="text-[13px] text-muted">Contact us to get it unblocked.</Text>
      </Stack>
      <Button asChild>
        <a href="mailto:support@nammamedmate.com">Contact us</a>
      </Button>
    </Stack>
  );
}
