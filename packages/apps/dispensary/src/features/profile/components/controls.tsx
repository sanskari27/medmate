import { Box } from "@/components/ui/Box";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

export function CardTitle({ children }: { children: string }) {
  return <Text className="text-[15px] font-bold tracking-tight text-ink">{children}</Text>;
}

export function ProfileSelect({
  id,
  value,
  options,
  disabled = false,
  onChange,
}: {
  id: string;
  value: string;
  options: readonly { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Box className="relative">
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "w-full appearance-none rounded-sm border border-line-2 px-3 py-[9px] pr-9 text-[13.5px] outline-none",
          disabled ? "cursor-not-allowed bg-wash-2 text-muted" : "bg-paper text-ink",
        )}
      >
        {options.map((option) => (
          <option key={option.value || "empty"} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Box className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Box>
    </Box>
  );
}

export function ToggleRow({
  label,
  on,
  badge,
  onToggle,
}: {
  label: string;
  on: boolean;
  badge?: string;
  onToggle: () => void;
}) {
  return (
    <Stack direction="row" align="center" className="gap-3">
      <Text as="span" className="min-w-0 flex-1 text-[13.5px] font-bold text-ink">
        {label}
        {badge ? (
          <Text
            as="span"
            className="ml-2 rounded-full bg-wash px-1.5 py-0.5 text-[10px] font-bold text-mid"
          >
            {badge}
          </Text>
        ) : null}
      </Text>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          "relative h-[22px] w-[38px] shrink-0 rounded-[11px] border-0 p-0 after:absolute after:top-0.5 after:left-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-paper after:shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:transition after:content-['']",
          on ? "bg-mid after:translate-x-4" : "bg-[#cddcd3]",
        )}
      />
    </Stack>
  );
}
