import type { ComponentProps } from "react";
import { Avatar } from "@/components/atoms/Avatar";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type ProductCellProps = Omit<ComponentProps<typeof Stack>, "children"> & {
  name: string;
  subtitle?: string;
  src?: string;
  alt?: string;
};

function monogram(name: string): string {
  const character = name.trim().charAt(0);
  return character ? character.toUpperCase() : "•";
}

export function ProductCell({ className, name, subtitle, src, alt, ...props }: ProductCellProps) {
  return (
    <Stack
      data-slot="product-cell"
      direction="row"
      align="center"
      gap={3}
      className={cn("min-w-0", className)}
      {...props}
    >
      <Avatar
        name={name}
        src={src}
        alt={alt}
        initials={monogram(name)}
        className="h-[38px] w-[38px] shrink-0 rounded-[10px] bg-wash text-[18px]"
      />
      <Stack gap={0} className="min-w-0 flex-1">
        <Text as="span" className="text-[13.5px] font-bold text-ink">
          {name}
        </Text>
        {subtitle ? (
          <Text as="span" variant="caption" className="text-[12px]">
            {subtitle}
          </Text>
        ) : null}
      </Stack>
    </Stack>
  );
}
