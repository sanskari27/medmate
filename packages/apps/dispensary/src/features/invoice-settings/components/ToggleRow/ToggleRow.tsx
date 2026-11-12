import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

export function ToggleRow({
  label,
  on,
  disabled = false,
  onClick,
}: {
  label: string;
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <Box className="flex items-center justify-between border-b border-line px-0 py-[9px]">
      <Text as="span" className="text-[13px] font-semibold">
        {label}
      </Text>
      <Button
        type="button"
        aria-pressed={on}
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "relative h-[22px] w-[38px] shrink-0 rounded-full border-0 p-0 shadow-none after:absolute after:top-0.5 after:left-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:transition after:content-['']",
          on ? "bg-mid hover:bg-mid after:translate-x-4" : "bg-[#cddcd3] hover:bg-[#cddcd3]",
        )}
      />
    </Box>
  );
}
