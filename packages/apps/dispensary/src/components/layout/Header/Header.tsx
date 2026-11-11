import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconMenu } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import type { HeaderProps } from "./Header.types";

export function Header({ title, sub, onMenu }: HeaderProps) {
  return (
    <Stack
      data-slot="app-header"
      direction="row"
      align="center"
      className="h-[60px] gap-4 border-b border-line bg-paper px-6 max-[1099px]:gap-2.5 max-[1099px]:px-4 max-[767px]:h-auto max-[767px]:flex-wrap max-[767px]:gap-2 max-[767px]:px-3 max-[767px]:pt-[max(10px,env(safe-area-inset-top))] max-[767px]:pb-2.5"
    >
      <Button
        variant="ghost"
        aria-label="Menu"
        className="hidden h-9 w-9 rounded-sm border-line p-0 text-ink-2 hover:border-line-2 hover:bg-wash-2 max-[1099px]:grid max-[767px]:h-11"
        onClick={onMenu}
      >
        <IconMenu size={18} />
      </Button>
      <Stack className="min-w-0">
        <Heading level={1} className="truncate text-[19px] font-bold max-[767px]:text-[17px]">
          {title}
        </Heading>
        <Text
          as="span"
          variant="caption"
          className="truncate text-[12.5px] leading-[1.5] font-medium"
        >
          {sub}
        </Text>
      </Stack>
    </Stack>
  );
}
