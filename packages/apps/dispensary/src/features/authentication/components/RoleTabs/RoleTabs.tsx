import { cn } from "@/utils/className";
import type { PharmacyPortalRole } from "@/types";

const OPTIONS: { value: PharmacyPortalRole; label: string }[] = [
  { value: "owner", label: "Pharmacy owner" },
  { value: "staff", label: "Staff" },
];

export function RoleTabs({
  value,
  onChange,
  className,
}: {
  value: PharmacyPortalRole;
  onChange: (value: PharmacyPortalRole) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Account"
      className={cn("grid grid-cols-2 rounded-lg bg-wash p-1", className)}
    >
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-md px-3 py-2 text-[13px] font-semibold",
              selected ? "bg-paper text-dark shadow-sm" : "text-muted hover:text-dark",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
