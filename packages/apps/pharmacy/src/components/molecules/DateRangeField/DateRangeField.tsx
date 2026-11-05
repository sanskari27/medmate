import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useId, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { IconCalendar } from "@/components/atoms/Icon";
import { Input } from "@/components/atoms/Input";
import { Label } from "@/components/atoms/Label";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";
import { RANGE_PRESETS, resolveRange, type RangePreset, type ResolvedRange } from "@/utils/date";

const triggerVariants = cva(
  "inline-flex h-auto min-w-[180px] justify-start gap-2 rounded-[10px] border-line bg-paper px-[13px] py-[9px] text-[13.5px] font-normal text-ink shadow-none hover:bg-paper",
);

const menuVariants = cva(
  "absolute top-[calc(100%+6px)] left-0 z-40 max-h-[340px] min-w-[300px] overflow-y-auto rounded-md border border-line bg-paper p-1.5 shadow-[0_14px_36px_rgba(20,40,30,0.18)]",
);

const presetOptionVariants = cva(
  "h-auto w-full justify-between gap-4 rounded-sm border-0 bg-transparent px-[11px] py-[9px] text-left text-[13.5px] font-normal text-ink shadow-none hover:bg-wash-2",
  {
    variants: {
      selected: {
        true: "bg-wash-2 font-bold text-green",
        false: "",
      },
    },
    defaultVariants: {
      selected: false,
    },
  },
);

export type DateRangeFieldProps = {
  now: number;
  preset: RangePreset;
  onPreset: (preset: RangePreset) => void;
  from: string;
  onFrom: (value: string) => void;
  to: string;
  onTo: (value: string) => void;
  resolved: ResolvedRange;
  className?: string;
};

function isoDate(timestamp: number): string {
  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function fromYmd(value: string, end = false): number {
  const parts = value.split("-");
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return new Date(year, month - 1, day, end ? 23 : 0, end ? 59 : 0, end ? 59 : 0, end ? 999 : 0).getTime();
}

function PresetOption({
  presetKey,
  label,
  sub,
  selected,
  onPick,
}: {
  presetKey: RangePreset;
  label: string;
  sub?: string;
  selected: boolean;
  onPick: (preset: RangePreset) => void;
} & VariantProps<typeof presetOptionVariants>) {
  function pick() {
    onPick(presetKey);
  }
  return (
    <Button type="button" variant="ghost" onClick={pick} className={presetOptionVariants({ selected })}>
      <Text as="span">{label}</Text>
      {sub ? (
        <Text as="span" variant="caption" className="whitespace-nowrap">
          {sub}
        </Text>
      ) : null}
    </Button>
  );
}

function PresetList({
  now,
  preset,
  onPick,
}: {
  now: number;
  preset: RangePreset;
  onPick: (preset: RangePreset) => void;
}) {
  const nodes: ReactNode[] = [];
  for (const item of RANGE_PRESETS) {
    const sub = item.key === "custom" ? undefined : resolveRange(item.key, now).sub;
    nodes.push(
      <PresetOption
        key={item.key}
        presetKey={item.key}
        label={item.label}
        sub={sub}
        selected={preset === item.key}
        onPick={onPick}
      />,
    );
  }
  return <>{nodes}</>;
}

export function DateRangeField({
  now,
  preset,
  onPreset,
  from,
  onFrom,
  to,
  onTo,
  resolved,
  className,
}: DateRangeFieldProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();
  const fromId = `${fieldId}-from`;
  const toId = `${fieldId}-to`;

  useEffect(
    function watchOutside() {
      if (!open) return;
      function onPointerDown(event: MouseEvent) {
        const target = event.target;
        if (rootRef.current && target instanceof Node && !rootRef.current.contains(target)) {
          setOpen(false);
        }
      }
      document.addEventListener("mousedown", onPointerDown);
      return function cleanup() {
        document.removeEventListener("mousedown", onPointerDown);
      };
    },
    [open],
  );

  function toggleOpen() {
    setOpen(!open);
  }

  function pickPreset(next: RangePreset) {
    onPreset(next);
    if (next !== "custom") setOpen(false);
  }

  function changeFrom(event: ChangeEvent<HTMLInputElement>) {
    onFrom(event.target.value);
  }

  function changeTo(event: ChangeEvent<HTMLInputElement>) {
    onTo(event.target.value);
  }

  return (
    <Box ref={rootRef} data-slot="date-range-field" className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        className={triggerVariants()}
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Box className="text-mid">
          <IconCalendar size={15} />
        </Box>
        <Text as="span" className="font-bold">
          {resolved.label}
        </Text>
        <Text as="span" className="ml-auto text-[11px] opacity-50">
          ▾
        </Text>
      </Button>
      {open ? (
        <Stack className={menuVariants()}>
          <PresetList now={now} preset={preset} onPick={pickPreset} />
          {preset === "custom" ? (
            <Stack direction="row" align="center" gap={2} className="px-[11px] py-2">
              <Label htmlFor={fromId} className="sr-only">
                From
              </Label>
              <Input id={fromId} type="date" value={from} max={to} onChange={changeFrom} className="min-w-0 flex-1" />
              <Text as="span">→</Text>
              <Label htmlFor={toId} className="sr-only">
                To
              </Label>
              <Input id={toId} type="date" value={to} min={from} onChange={changeTo} className="min-w-0 flex-1" />
            </Stack>
          ) : null}
        </Stack>
      ) : null}
    </Box>
  );
}

export function useDateRange(now: number, initial: RangePreset = "last-365") {
  const [preset, setPreset] = useState<RangePreset>(initial);
  const [from, setFrom] = useState(isoDate(now - 29 * 86400000));
  const [to, setTo] = useState(isoDate(now));
  const resolved = useMemo(
    function resolve() {
      return resolveRange(preset, now, fromYmd(from), fromYmd(to, true));
    },
    [preset, now, from, to],
  );
  function inWindow(timestamp: number) {
    return timestamp >= resolved.from && timestamp <= resolved.to;
  }
  const node = (
    <DateRangeField
      now={now}
      preset={preset}
      onPreset={setPreset}
      from={from}
      onFrom={setFrom}
      to={to}
      onTo={setTo}
      resolved={resolved}
    />
  );
  return {
    from: resolved.from,
    to: resolved.to,
    label: resolved.label,
    sub: resolved.sub,
    inWindow,
    node,
  };
}
