import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/utils/className";
import { Input } from "../Input";
import { Label } from "../Label";
import { Select } from "../Select";
import { Stack } from "../Stack";

export function FilterField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  const generated = useId();
  const childId = isValidElement<{ id?: string }>(children) ? children.props.id : undefined;
  const linked = htmlFor ?? childId ?? (isFieldControl(children) ? generated : undefined);
  const control =
    linked && isValidElement<{ id?: string }>(children) && !childId
      ? cloneElement(children as ReactElement<{ id?: string }>, { id: linked })
      : children;

  return (
    <Stack className={cn("min-w-0 gap-1", className)}>
      <Label htmlFor={linked} size="sm" className="tracking-[0.06em] text-muted uppercase">
        {label}
      </Label>
      {control}
    </Stack>
  );
}

function isFieldControl(children: ReactNode) {
  return isValidElement(children) && (children.type === Input || children.type === Select);
}
