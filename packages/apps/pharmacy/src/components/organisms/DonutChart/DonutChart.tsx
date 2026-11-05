import { Box } from "@/components/atoms/Box";
import { Heading } from "@/components/atoms/Heading";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { EmptyState } from "@/components/molecules/EmptyState";
import { cn } from "@/utils/className";
import type { DonutArc, DonutChartProps } from "./DonutChart.types";
import { buildDonutArcs, DONUT_CENTER } from "./DonutChart.utils";

function DonutSlice({ arc, fmt }: { arc: DonutArc; fmt: (value: number) => string }) {
  return (
    <path d={arc.d} fill={arc.color}>
      <title>
        {arc.label}: {fmt(arc.amt)} · {Math.round(arc.frac * 100)}%
      </title>
    </path>
  );
}

function DonutSlices({ arcs, fmt }: { arcs: DonutArc[]; fmt: (value: number) => string }) {
  function renderSlice(arc: DonutArc) {
    return <DonutSlice key={arc.key} arc={arc} fmt={fmt} />;
  }
  return arcs.map(renderSlice);
}

export function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <svg width={11} height={11} className={className} aria-hidden>
      <rect width={11} height={11} rx={3} fill={color} />
    </svg>
  );
}

export function RingMark({ pct }: { pct: number }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width={78} height={78} viewBox="0 0 78 78">
      <circle cx="39" cy="39" r={radius} fill="none" stroke="var(--color-wash)" strokeWidth="8" />
      <circle
        cx="39"
        cy="39"
        r={radius}
        fill="none"
        stroke="var(--color-mid)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 39 39)"
      />
    </svg>
  );
}

function DonutLegendRow({ arc, fmt }: { arc: DonutArc; fmt: (value: number) => string }) {
  return (
    <Stack direction="row" align="center" justify="between" gap={2} className="mb-2 text-[12.5px]">
      <Stack direction="row" align="center" gap={2}>
        <Swatch color={arc.color} />
        <Text as="span" className="font-semibold">
          {arc.label}
        </Text>
      </Stack>
      <Text as="span" variant="caption">
        {fmt(arc.amt)} · {Math.round(arc.frac * 100)}%
      </Text>
    </Stack>
  );
}

function DonutLegend({ arcs, fmt }: { arcs: DonutArc[]; fmt: (value: number) => string }) {
  function renderLegend(arc: DonutArc) {
    return <DonutLegendRow key={arc.key} arc={arc} fmt={fmt} />;
  }
  return (
    <Box className="w-full max-w-[300px] min-w-[210px] flex-1 rounded-md bg-wash-2 px-3.5 py-2.5">
      {arcs.map(renderLegend)}
    </Box>
  );
}

export function DonutChart({ rows, fmt, className }: DonutChartProps) {
  const { total, arcs } = buildDonutArcs(rows);
  return (
    <Stack
      data-slot="donut-chart"
      direction="row"
      align="center"
      justify="center"
      wrap
      gap={6}
      className={cn("py-1.5", className)}
    >
      {total <= 0 ? (
        <EmptyState title="No data for the selected sources." />
      ) : (
        <>
          <svg className="h-[260px] w-[260px] shrink-0" viewBox="0 0 220 220" role="img">
            <DonutSlices arcs={arcs} fmt={fmt} />
            <foreignObject x={DONUT_CENTER - 70} y={DONUT_CENTER - 24} width={140} height={48}>
              <Stack align="center" gap={0}>
                <Heading level={4} className="text-center text-[19px]">
                  {fmt(total)}
                </Heading>
                <Text variant="caption" className="text-center">
                  total
                </Text>
              </Stack>
            </foreignObject>
          </svg>
          <DonutLegend arcs={arcs} fmt={fmt} />
        </>
      )}
    </Stack>
  );
}
