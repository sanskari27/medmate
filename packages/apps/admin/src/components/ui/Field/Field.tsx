import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Label } from "@/components/ui/Label";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

const fieldVariants = cva("", {
  variants: {
    gap: {
      tight: "",
      normal: "",
    },
  },
});

export type FieldProps = Omit<ComponentProps<typeof Stack>, "children"> &
  VariantProps<typeof fieldVariants> & {
    label: ReactNode;
    htmlFor?: string;
    hint?: string;
    error?: string;
    children: ReactNode;
  };

export function Field({ className, label, htmlFor, hint, error, children, ...props }: FieldProps) {
  return (
    <Stack data-slot="field" className={cn(fieldVariants(), "gap-1.5", className)} {...props}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? <Text className="text-[12px] font-bold text-rose">{error}</Text> : null}
      {hint && !error ? <Text variant="caption">{hint}</Text> : null}
    </Stack>
  );
}
