import { useMemo, useState, type ChangeEvent } from "react";
import { Input } from "@/components/atoms/Input";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import type { PeriodWindow, PMode } from "./PeriodFilter.types";

function pad(value: number) {
  return String(value).padStart(2, "0");
}
function isoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function isoMonth(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}
function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}
function endOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
}
function monthLabel(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}
function parseMonth(value: string) {
  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

type PeriodState = {
  mode: PMode;
  today: string;
  month: string;
  monthTo: string;
  monthRange: boolean;
  year: number;
  yearTo: number;
  yearRange: boolean;
  fy: number;
  from: string;
  to: string;
  now: number;
};

function computeWindow(state: PeriodState): { start: number; end: number; label: string } {
  switch (state.mode) {
    case "today": {
      const date = new Date(state.today + "T12:00:00");
      return {
        start: startOfDay(date),
        end: endOfDay(date),
        label: date.toLocaleDateString("en-IN", {
          weekday: "short",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
      };
    }
    case "month": {
      if (state.monthRange) {
        const from = parseMonth(state.month);
        const to = parseMonth(state.monthTo);
        let start = new Date(from.year, from.month - 1, 1);
        let end = new Date(to.year, to.month, 0);
        if (end < start) {
          start = new Date(to.year, to.month - 1, 1);
          end = new Date(from.year, from.month, 0);
        }
        return {
          start: startOfDay(start),
          end: endOfDay(end),
          label: `${monthLabel(start)} → ${monthLabel(new Date(end.getFullYear(), end.getMonth(), 1))}`,
        };
      }
      const { year, month } = parseMonth(state.month);
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      return {
        start: startOfDay(start),
        end: endOfDay(end),
        label: start.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      };
    }
    case "year": {
      if (state.yearRange) {
        const from = Math.min(state.year, state.yearTo);
        const to = Math.max(state.year, state.yearTo);
        return {
          start: startOfDay(new Date(from, 0, 1)),
          end: endOfDay(new Date(to, 11, 31)),
          label: `${from} → ${to}`,
        };
      }
      return {
        start: startOfDay(new Date(state.year, 0, 1)),
        end: endOfDay(new Date(state.year, 11, 31)),
        label: String(state.year),
      };
    }
    case "fy":
      return {
        start: startOfDay(new Date(state.fy, 3, 1)),
        end: endOfDay(new Date(state.fy + 1, 2, 31)),
        label: `FY ${state.fy}-${pad((state.fy + 1) % 100)}`,
      };
    case "custom": {
      const start = new Date(state.from + "T12:00:00");
      const end = new Date(state.to + "T12:00:00");
      return { start: startOfDay(start), end: endOfDay(end), label: `${state.from} → ${state.to}` };
    }
    default:
      return { start: 0, end: state.now, label: "All time" };
  }
}

function PeriodOption({ value, label }: { value: string; label: string }) {
  return { value: String(value), label: String(label) };
}

function YearOption({ year }: { year: number }) {
  return { value: String(year), label: String(year) };
}

function FyOption({ year }: { year: number }) {
  return { value: String(year), label: "FY " + String(year) + "-" + String(pad((year + 1) % 100)) };
}

function RangeArrow() {
  return (
    <Text as="span" className="text-xs text-muted">
      →
    </Text>
  );
}

function ScopeSelect({ range, onChange }: { range: boolean; onChange: (next: boolean) => void }) {
  function onScope(event: ChangeEvent<HTMLSelectElement>) {
    onChange(event.target.value === "range");
  }
  return (
    <Select
      className="w-[96px]"
      value={range ? "range" : "single"}
      onChange={onScope}
      aria-label="Range scope"
      options={[
        { value: "single", label: "Single" },
        { value: "range", label: "Range" },
      ]}
    />
  );
}

function YearSelect({
  years,
  value,
  onChange,
  label,
}: {
  years: number[];
  value: number;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  label: string;
}) {
  function renderYear(year: number) {
    return YearOption({ year: year });
  }
  return (
    <Select
      className="w-[100px]"
      value={value}
      onChange={onChange}
      aria-label={label}
      options={[...years.map(renderYear)]}
    />
  );
}

function FySelect({
  years,
  value,
  onChange,
}: {
  years: number[];
  value: number;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  function renderFy(year: number) {
    return FyOption({ year: year });
  }
  return (
    <Select
      className="w-[140px]"
      value={value}
      onChange={onChange}
      aria-label="Financial year"
      options={[...years.map(renderFy)]}
    />
  );
}

function MonthControls({
  range,
  month,
  monthTo,
  onScope,
  onMonth,
  onMonthTo,
}: {
  range: boolean;
  month: string;
  monthTo: string;
  onScope: (next: boolean) => void;
  onMonth: (event: ChangeEvent<HTMLInputElement>) => void;
  onMonthTo: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <ScopeSelect range={range} onChange={onScope} />
      <Input
        type="month"
        className="w-[150px]"
        value={month}
        onChange={onMonth}
        aria-label="Month"
      />
      {range ? (
        <>
          <RangeArrow />
          <Input
            type="month"
            className="w-[150px]"
            value={monthTo}
            onChange={onMonthTo}
            aria-label="Month to"
          />
        </>
      ) : null}
    </>
  );
}

function YearControls({
  range,
  year,
  yearTo,
  years,
  onScope,
  onYear,
  onYearTo,
}: {
  range: boolean;
  year: number;
  yearTo: number;
  years: number[];
  onScope: (next: boolean) => void;
  onYear: (event: ChangeEvent<HTMLSelectElement>) => void;
  onYearTo: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <>
      <ScopeSelect range={range} onChange={onScope} />
      <YearSelect years={years} value={year} onChange={onYear} label="Year" />
      {range ? (
        <>
          <RangeArrow />
          <YearSelect years={years} value={yearTo} onChange={onYearTo} label="Year to" />
        </>
      ) : null}
    </>
  );
}

/** Shared reporting period filter: Today / Month / Year / FY / Custom / All. */
export function usePeriod(now: number, initial: PMode = "month"): PeriodWindow {
  const base = useMemo(
    function currentDate() {
      return new Date(now);
    },
    [now],
  );
  const [mode, setMode] = useState<PMode>(initial);
  const [today, setToday] = useState(isoDate(base));
  const [month, setMonth] = useState(isoMonth(base));
  const [monthTo, setMonthTo] = useState(isoMonth(base));
  const [monthRange, setMonthRange] = useState(false);
  const [year, setYear] = useState(base.getFullYear());
  const [yearTo, setYearTo] = useState(base.getFullYear());
  const [yearRange, setYearRange] = useState(false);
  const [fy, setFy] = useState(base.getMonth() >= 3 ? base.getFullYear() : base.getFullYear() - 1);
  const [from, setFrom] = useState(isoDate(new Date(base.getFullYear(), base.getMonth(), 1)));
  const [to, setTo] = useState(isoDate(base));

  const window = useMemo(
    function readWindow() {
      return computeWindow({
        mode,
        today,
        month,
        monthTo,
        monthRange,
        year,
        yearTo,
        yearRange,
        fy,
        from,
        to,
        now,
      });
    },
    [mode, today, month, monthTo, monthRange, year, yearTo, yearRange, fy, from, to, now],
  );

  function inWindow(timestamp: number) {
    return timestamp >= window.start && timestamp <= window.end;
  }
  function onModeChange(event: ChangeEvent<HTMLSelectElement>) {
    setMode(event.target.value as PMode);
  }
  function onTodayChange(event: ChangeEvent<HTMLInputElement>) {
    setToday(event.target.value);
  }
  function onMonthChange(event: ChangeEvent<HTMLInputElement>) {
    setMonth(event.target.value);
  }
  function onMonthToChange(event: ChangeEvent<HTMLInputElement>) {
    setMonthTo(event.target.value);
  }
  function onMonthScope(next: boolean) {
    setMonthRange(next);
  }
  function onYearChange(event: ChangeEvent<HTMLSelectElement>) {
    setYear(Number(event.target.value));
  }
  function onYearToChange(event: ChangeEvent<HTMLSelectElement>) {
    setYearTo(Number(event.target.value));
  }
  function onYearScope(next: boolean) {
    setYearRange(next);
  }
  function onFyChange(event: ChangeEvent<HTMLSelectElement>) {
    setFy(Number(event.target.value));
  }
  function onFromChange(event: ChangeEvent<HTMLInputElement>) {
    setFrom(event.target.value);
  }
  function onToChange(event: ChangeEvent<HTMLInputElement>) {
    setTo(event.target.value);
  }

  const years = Array.from({ length: 6 }, function yearAt(_item, index) {
    return base.getFullYear() - 4 + index;
  });
  const financialYears = Array.from({ length: 4 }, function fyAt(_item, index) {
    return base.getFullYear() - 3 + index;
  });

  const node = (
    <Stack data-slot="period-filter" direction="row" align="center" wrap className="gap-1.5">
      <Select
        className="w-[140px]"
        value={mode}
        onChange={onModeChange}
        aria-label="Period"
        options={[
          PeriodOption({ value: "today", label: "Today" }),
          PeriodOption({ value: "month", label: "Month" }),
          PeriodOption({ value: "year", label: "Year" }),
          PeriodOption({ value: "fy", label: "Financial Year" }),
          PeriodOption({ value: "custom", label: "Custom dates" }),
          PeriodOption({ value: "all", label: "All time" }),
        ]}
      />
      {mode === "today" ? (
        <Input
          type="date"
          className="w-40"
          value={today}
          onChange={onTodayChange}
          aria-label="Day"
        />
      ) : null}
      {mode === "month" ? (
        <MonthControls
          range={monthRange}
          month={month}
          monthTo={monthTo}
          onScope={onMonthScope}
          onMonth={onMonthChange}
          onMonthTo={onMonthToChange}
        />
      ) : null}
      {mode === "year" ? (
        <YearControls
          range={yearRange}
          year={year}
          yearTo={yearTo}
          years={years}
          onScope={onYearScope}
          onYear={onYearChange}
          onYearTo={onYearToChange}
        />
      ) : null}
      {mode === "fy" ? <FySelect years={financialYears} value={fy} onChange={onFyChange} /> : null}
      {mode === "custom" ? (
        <>
          <Input
            type="date"
            className="w-[150px]"
            value={from}
            onChange={onFromChange}
            aria-label="From"
          />
          <RangeArrow />
          <Input
            type="date"
            className="w-[150px]"
            value={to}
            onChange={onToChange}
            aria-label="To"
          />
        </>
      ) : null}
    </Stack>
  );

  return { node, inWindow, label: window.label, start: window.start, end: window.end, mode };
}

export type { PMode, PeriodWindow };
