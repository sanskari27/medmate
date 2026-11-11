import type { ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";

export function ContactCard({
  icon,
  title,
  detail,
  action,
  href,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  detail: string;
  action: string;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <Box className="flex flex-col gap-3 rounded-md border border-line bg-paper p-[18px] shadow-sm">
      <Box className="grid h-10 w-10 place-items-center rounded-xl bg-wash text-mid">{icon}</Box>
      <Box>
        <Text className="text-[15px] font-bold text-ink">{title}</Text>
        <Text className="text-[12.5px] text-muted">{detail}</Text>
      </Box>
      {href ? (
        <a
          href={href}
          className="inline-flex h-9 items-center justify-center rounded-sm border border-line-2 bg-paper px-3 text-[13px] font-bold text-ink-2 hover:bg-wash"
        >
          {action}
        </a>
      ) : (
        <Button variant="secondary" onClick={onClick}>
          {action}
        </Button>
      )}
    </Box>
  );
}
