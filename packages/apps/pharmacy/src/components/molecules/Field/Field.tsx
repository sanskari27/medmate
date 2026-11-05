import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Label } from "@/components/atoms/Label";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
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
    label: string;
    htmlFor?: string;
    hint?: string;
    error?: string;
    children: ReactNode;
  };

export function Field({ className, label, htmlFor, hint, error, children, ...props }: FieldProps) {
  return (
    <Stack data-slot="field" gap={2} className={cn(fieldVariants(), className)} {...props}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <Text variant="caption" className="text-rose">
          {error}
        </Text>
      ) : null}
      {hint && !error ? <Text variant="caption">{hint}</Text> : null}
    </Stack>
  );
}
