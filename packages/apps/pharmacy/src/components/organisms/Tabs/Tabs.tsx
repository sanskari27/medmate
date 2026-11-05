import { cva } from "class-variance-authority";
import { Button } from "@/components/atoms/Button";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";
import type { TabProps, TabsProps } from "./Tabs.types";

const tabVariants = cva(
  "h-auto rounded-none border-x-0 border-t-0 border-b-2 px-3 py-2 text-[13px] font-bold no-underline shadow-none hover:no-underline",
  {
    variants: {
      selected: {
        true: "border-mid text-mid",
        false: "border-transparent text-muted hover:text-ink",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export function Tab({ className, selected, type = "button", children, ...props }: TabProps) {
  return (
    <Button
      data-slot="tab"
      type={type}
      variant="link"
      role="tab"
      aria-selected={Boolean(selected)}
      className={cn(tabVariants({ selected }), className)}
      {...props}
    >
      {children}
    </Button>
  );
}

export function Tabs({ label, children, className }: TabsProps) {
  return (
    <Stack
      data-slot="tabs"
      direction="row"
      role="tablist"
      aria-label={label}
      className={cn("border-b border-line", className)}
    >
      {children}
    </Stack>
  );
}

export { tabVariants };
export type { TabProps, TabsProps };
