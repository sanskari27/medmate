import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { IconCheck } from "@/components/atoms/Icon";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const choiceCardVariants = cva(
  "relative h-auto w-full flex-col items-stretch rounded-md border-[1.5px] border-line-2 bg-paper px-[18px] py-4 text-left font-normal whitespace-normal shadow-none hover:border-light",
  {
    variants: {
      selected: {
        true: "border-mid bg-wash-2 shadow-[0_0_0_3px_rgba(47,125,82,0.12)] hover:border-mid",
        false: "",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export type ChoiceCardProps = Omit<ComponentProps<typeof Button>, "children"> &
  VariantProps<typeof choiceCardVariants> & {
    title: string;
    description?: string;
    icon?: ReactNode;
    points?: string[];
  };

function ChoicePoint({ label }: { label: string }) {
  return (
    <Stack direction="row" align="center" gap={2} className="text-mid">
      <IconCheck size={13} />
      <Text as="span" className="text-[12.5px] font-normal text-ink-2">
        {label}
      </Text>
    </Stack>
  );
}

export function ChoiceCard({
  className,
  selected,
  title,
  description,
  icon,
  points = [],
  type = "button",
  ...props
}: ChoiceCardProps) {
  const rows: ReactNode[] = [];
  for (let index = 0; index < points.length; index += 1) {
    const label = points[index];
    if (!label) continue;
    rows.push(<ChoicePoint key={`${label}-${index}`} label={label} />);
  }
  return (
    <Button
      data-slot="choice-card"
      type={type}
      variant="ghost"
      aria-pressed={Boolean(selected)}
      className={cn(choiceCardVariants({ selected }), className)}
      {...props}
    >
      {icon ? <Box className="text-[26px] text-mid">{icon}</Box> : null}
      <Stack gap={0} className="mt-1.5">
        <Text as="span" className="font-display text-[16px] font-extrabold text-dark">
          {title}
        </Text>
        {description ? (
          <Text as="span" variant="caption" className="mt-px block text-[12.5px]">
            {description}
          </Text>
        ) : null}
      </Stack>
      {rows.length > 0 ? (
        <Stack gap={0} className="mt-3 gap-[5px]">
          {rows}
        </Stack>
      ) : null}
      <Box
        className={cn(
          "absolute top-4 right-4 h-5 w-5 rounded-full border-2 border-line-2",
          selected && "border-mid bg-mid shadow-[inset_0_0_0_3px_#fff]",
        )}
      />
    </Button>
  );
}

export { choiceCardVariants };
