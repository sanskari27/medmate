import { Box } from "@/components/atoms/Box";
import { Text } from "@/components/atoms/Text";
import { EmptyState } from "@/components/molecules/EmptyState";
import { cn } from "@/utils/className";
import type { TrendChartProps, TrendGeometry, TrendSeries } from "./TrendChart.types";
import { buildTrendGeometry, centerX, valueY } from "./TrendChart.utils";

function TrendAxisLabel({
  x,
  y,
  width,
  height,
  children,
  align,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  children: string;
  align: "end" | "center";
}) {
  return (
    <foreignObject x={x} y={y} width={width} height={height}>
      <Text variant="caption" className={align === "end" ? "text-right" : "text-center"}>
        {children}
      </Text>
    </foreignObject>
  );
}

function TrendGrid({
  geometry,
  fmtAxis,
}: {
  geometry: TrendGeometry;
  fmtAxis: (value: number) => string;
}) {
  function renderGrid(fraction: number) {
    const y = geometry.padTop + geometry.plotHeight * (1 - fraction);
    return (
      <g key={fraction}>
        <line
          x1={geometry.padLeft}
          x2={geometry.width - geometry.padRight}
          y1={y}
          y2={y}
          stroke="var(--color-line)"
          strokeWidth={1}
        />
        <TrendAxisLabel x={4} y={y - 8} width={geometry.padLeft - 8} height={16} align="end">
          {fmtAxis(geometry.max * fraction)}
        </TrendAxisLabel>
      </g>
    );
  }
  return geometry.grid.map(renderGrid);
}

function TrendXLabels({ labels, geometry }: { labels: string[]; geometry: TrendGeometry }) {
  function renderLabel(label: string, index: number) {
    const x = centerX(geometry, index);
    return (
      <TrendAxisLabel
        key={label + index}
        x={x - 36}
        y={geometry.height - 22}
        width={72}
        height={16}
        align="center"
      >
        {label}
      </TrendAxisLabel>
    );
  }
  return labels.map(renderLabel);
}

function TrendBand({
  index,
  labels,
  series,
  valOf,
  fmt,
  geometry,
}: {
  index: number;
  labels: string[];
  series: TrendSeries[];
  valOf: TrendChartProps["valOf"];
  fmt: TrendChartProps["fmt"];
  geometry: TrendGeometry;
}) {
  const groupWidth = geometry.band * 0.72;
  const barWidth = groupWidth / series.length;
  function renderBar(item: TrendSeries, seriesIndex: number) {
    const value = valOf(item, index);
    const x = centerX(geometry, index) - groupWidth / 2 + seriesIndex * barWidth;
    const y = valueY(geometry, value);
    return (
      <rect
        key={item.key + index}
        x={x + 1}
        y={y}
        width={Math.max(1, barWidth - 2)}
        height={Math.max(0, geometry.plotHeight + geometry.padTop - y)}
        fill={item.color}
        rx={1.5}
      >
        <title>
          {labels[index]} · {item.label}: {fmt(value)}
        </title>
      </rect>
    );
  }
  return series.map(renderBar);
}

function TrendBands({
  labels,
  series,
  type,
  valOf,
  fmt,
  geometry,
}: {
  labels: string[];
  series: TrendSeries[];
  type: TrendChartProps["type"];
  valOf: TrendChartProps["valOf"];
  fmt: TrendChartProps["fmt"];
  geometry: TrendGeometry;
}) {
  if (type !== "group") return null;
  function renderBand(label: string, index: number) {
    return (
      <TrendBand
        key={label + index}
        index={index}
        labels={labels}
        series={series}
        valOf={valOf}
        fmt={fmt}
        geometry={geometry}
      />
    );
  }
  return labels.map(renderBand);
}

function TrendLine({
  item,
  labels,
  valOf,
  fmt,
  geometry,
}: {
  item: TrendSeries;
  labels: string[];
  valOf: TrendChartProps["valOf"];
  fmt: TrendChartProps["fmt"];
  geometry: TrendGeometry;
}) {
  const points = labels.map(function pointAt(_label, index) {
    return [centerX(geometry, index), valueY(geometry, valOf(item, index))] as const;
  });
  function joinPoint(point: readonly [number, number]) {
    return point.join(",");
  }
  function renderPoint(point: readonly [number, number], index: number) {
    return (
      <circle
        key={item.key + index}
        cx={point[0]}
        cy={point[1]}
        r={3}
        fill="#fff"
        stroke={item.color}
        strokeWidth={2}
      >
        <title>
          {labels[index]} · {item.label}: {fmt(valOf(item, index))}
        </title>
      </circle>
    );
  }
  return (
    <g>
      <polyline
        points={points.map(joinPoint).join(" ")}
        fill="none"
        stroke={item.color}
        strokeWidth={2.4}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {points.map(renderPoint)}
    </g>
  );
}

function TrendLines({
  labels,
  series,
  type,
  valOf,
  fmt,
  geometry,
}: {
  labels: string[];
  series: TrendSeries[];
  type: TrendChartProps["type"];
  valOf: TrendChartProps["valOf"];
  fmt: TrendChartProps["fmt"];
  geometry: TrendGeometry;
}) {
  if (type !== "line") return null;
  function renderSeries(item: TrendSeries) {
    return (
      <TrendLine
        key={item.key}
        item={item}
        labels={labels}
        valOf={valOf}
        fmt={fmt}
        geometry={geometry}
      />
    );
  }
  return series.map(renderSeries);
}

export function TrendChart({
  labels,
  series,
  type,
  valOf,
  fmtAxis,
  fmt,
  className,
}: TrendChartProps) {
  if (series.length === 0) {
    return (
      <Box data-slot="trend-chart" className={className}>
        <EmptyState title="Select at least one source above." />
      </Box>
    );
  }
  const rawMax = Math.max(
    1,
    ...series.flatMap(function seriesValues(item) {
      function valueAt(_label: string, index: number) {
        return valOf(item, index);
      }
      return labels.map(valueAt);
    }),
  );
  const geometry = buildTrendGeometry(labels.length, rawMax);
  return (
    <svg
      data-slot="trend-chart"
      className={cn("h-auto w-full", className)}
      viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      <TrendGrid geometry={geometry} fmtAxis={fmtAxis} />
      <TrendXLabels labels={labels} geometry={geometry} />
      <TrendBands
        labels={labels}
        series={series}
        type={type}
        valOf={valOf}
        fmt={fmt}
        geometry={geometry}
      />
      <TrendLines
        labels={labels}
        series={series}
        type={type}
        valOf={valOf}
        fmt={fmt}
        geometry={geometry}
      />
    </svg>
  );
}
