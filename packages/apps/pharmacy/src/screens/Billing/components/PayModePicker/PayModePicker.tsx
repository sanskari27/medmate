import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { PAY_LABEL } from "@/utils";
import { cn } from "@/utils/className";
import type { PayModePickerProps, PayOption } from "./PayModePicker.types";

function PayTile({
  option,
  selected,
  onSelect,
}: {
  option: PayOption;
  selected: boolean;
  onSelect: (mode: PayOption["m"]) => void;
}) {
  function selectMode() {
    onSelect(option.m);
  }
  const Icon = option.Ic;
  return (
    <Button
      variant="ghost"
      onClick={selectMode}
      className={cn(
        "h-auto flex-col gap-[3px] rounded-[9px] px-1 py-[9px] text-[11.5px] font-bold",
        selected
          ? "border-mid bg-wash text-mid shadow-[inset_0_0_0_2px_rgba(47,125,82,0.15)]"
          : "border-line-2 bg-paper text-ink-2",
      )}
    >
      <Box className="text-[16px]">
        <Icon size={16} />
      </Box>
      {PAY_LABEL[option.m]}
    </Button>
  );
}

export function PayModePicker({ options, selected, onSelect }: PayModePickerProps) {
  function renderOption(option: PayOption) {
    return <PayTile key={option.m} option={option} selected={selected === option.m} onSelect={onSelect} />;
  }
  return <Box className="mb-[11px] grid grid-cols-4 gap-[7px]">{options.map(renderOption)}</Box>;
}
