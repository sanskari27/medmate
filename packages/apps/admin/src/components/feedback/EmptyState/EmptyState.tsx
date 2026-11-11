import type { ReactNode } from "react";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";

export function EmptyState({ title, body }: { title: string; body: ReactNode }) {
  return (
    <Stack className="rounded-lg border border-dashed border-line-2 bg-paper px-6 py-10">
      <Heading level={2} className="text-[20px]">
        {title}
      </Heading>
      <Text className="mt-1.5 text-[13.5px] text-muted">{body}</Text>
    </Stack>
  );
}
