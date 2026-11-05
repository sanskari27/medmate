import type { ComponentProps } from "react";
import { Input } from "@/components/atoms/Input";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

export type SearchFieldProps = Omit<ComponentProps<typeof Input>, "type" | "variant"> & {
  label?: string;
  containerClassName?: string;
};

export function SearchField({
  label = "Search",
  className,
  containerClassName,
  ...props
}: SearchFieldProps) {
  return (
    <Stack
      data-slot="search-field"
      direction="row"
      align="center"
      className={cn("rounded-sm border border-line-2 bg-paper px-3", containerClassName)}
    >
      <Input aria-label={label} type="search" variant="plain" className={className} {...props} />
    </Stack>
  );
}
