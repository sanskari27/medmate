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
      className="fixed top-2 left-1/2 z-[120] m-0 w-max max-w-[calc(100%-1rem)] -translate-x-1/2 rounded-full border border-[#f3c0c0] px-1 py-1 pl-2.5 text-xs font-semibold"
    >
      <Stack direction="row" align="center" gap={2}>
        <Text as="span" className="truncate text-xs font-semibold text-rose">
          Support · {profile.name} · {impersonator}
        </Text>
        <Button
          size="sm"
          variant="ghost"
          onClick={signOut}
          className="h-auto rounded-xs border-transparent bg-transparent px-2 py-[3px] text-[11px] text-rose shadow-none hover:border-transparent hover:bg-transparent hover:text-rose"
        >
          Exit
        </Button>
      </Stack>
    </Banner>
  );
}
