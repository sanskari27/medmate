import { cva } from "class-variance-authority";
import { useId, type ComponentProps } from "react";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const phoneFieldVariants = cva("");

const prefixVariants = cva(
  "grid shrink-0 place-items-center rounded-sm border border-line-2 bg-wash px-3.5 font-extrabold text-dark",
);

export type PhoneFieldProps = ComponentProps<typeof Input> & {
  prefix?: string;
  label?: string;
};

export function PhoneField({ className, prefix = "+91", label, id, ...props }: PhoneFieldProps) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <Stack data-slot="phone-field" gap={2} className={cn(phoneFieldVariants(), className)}>
      {label ? <Label htmlFor={fieldId}>{label}</Label> : null}
      <Stack direction="row" align="stretch" gap={2}>
        <Text as="span" className={prefixVariants()}>
          {prefix}
        </Text>
        <Input id={fieldId} inputMode="numeric" className="min-w-0 flex-1" {...props} />
      </Stack>
    </Stack>
  );
}

export { phoneFieldVariants };
