import { Button, Stack, Text } from "@/components/atoms";
import { Banner } from "@/components/molecules/Banner";
import { usePharma } from "@/hooks";

export function SupportBanner() {
  const { impersonator, profile, signOut } = usePharma();
  if (!impersonator) return null;
  return (
    <Banner
      role="status"
      tone="rose"
      className="fixed top-2 left-1/2 z-[120] w-max max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-full border px-1 py-1 pl-2.5"
    >
      <Stack direction="row" align="center" gap={2}>
        <Text as="span" className="truncate text-xs font-semibold">
          Support · {profile.name} · {impersonator}
        </Text>
        <Button size="sm" variant="ghost" onClick={signOut}>
          Exit
        </Button>
      </Stack>
    </Banner>
  );
}
