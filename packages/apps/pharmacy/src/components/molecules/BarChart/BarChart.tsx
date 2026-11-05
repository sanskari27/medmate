import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/utils/className";
import {
  layoutBars,
  type BarColumnInput,
  type BarColumnLayout,
  type BarRect,
} from "./BarChart.utils";

export type BarChartProps = Omit<ComponentProps<"svg">, "children"> & {
  columns: BarColumnInput[];
  width?: number;
};

export type { BarColumnInput, BarSegmentInput, BarTone } from "./BarChart.utils";

function safeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function BarSegment({ rect, gradientId }: { rect: BarRect; gradientId: string }) {
  const fill = rect.fill ?? (rect.tone === "on" ? `url(#${gradientId})` : "#D9A648");
  return <rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} fill={fill} />;
}

function BarColumnShape({ column, gradientId }: { column: BarColumnLayout; gradientId: string }) {
  const clipId = `${gradientId}-${column.labelX}`;
  const segments: ReactNode[] = [];
  for (let index = 0; index < column.rects.length; index += 1) {
    const rect = column.rects[index];
    if (!rect) continue;
    segments.push(<BarSegment key={index} rect={rect} gradientId={gradientId} />);
  }
  return (
    <g>
      <clipPath id={clipId}>
        <rect
          x={column.clip.x}
          y={column.clip.y}
          width={column.clip.width}
          height={column.clip.height}
          rx={column.clip.radius}
        />
      </clipPath>
      <g clipPath={`url(#${clipId})`}>{segments}</g>
      <text
        x={column.labelX}
        y={column.labelY}
        textAnchor="middle"
        fill="#5d7a6b"
        fontSize="11"
        fontWeight="600"
      >
        {column.label}
      </text>
    </g>
  );
}

export function BarChart({ columns, width, className, ...props }: BarChartProps) {
  const gradientId = safeId(useId()) || "bar-on";
  const layout = layoutBars(columns, width);
  const shapes: ReactNode[] = [];
  for (let index = 0; index < layout.columns.length; index += 1) {
    const column = layout.columns[index];
    if (!column) continue;
    shapes.push(<BarColumnShape key={index} column={column} gradientId={gradientId} />);
  }
  return (
    <svg
      data-slot="bar-chart"
      role="img"
      aria-label="Bar chart"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      className={cn("h-[180px] w-full", className)}
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A9E6E" />
          <stop offset="1" stopColor="#2F7D52" />
        </linearGradient>
      </defs>
      {shapes}
    </svg>
  );
}

export type ColorFillProps = {
  color: string;
  className?: string;
  radius?: number;
  width?: string | number;
  height?: string | number;
};

function linearStops(color: string): { from: string; to: string } | null {
  const match = /^linear-gradient\(135deg,([^,]+),([^)]+)\)$/.exec(color);
  if (!match?.[1] || !match[2]) return null;
  return { from: match[1], to: match[2] };
}

export function ColorFill({ color, className, radius = 0, width = "100%", height = "100%" }: ColorFillProps) {
  const gradientId = safeId(useId()) || "fill";
  const gradient = linearStops(color);
  return (
    <svg className={className} width={width} height={height} aria-hidden="true">
      {gradient ? (
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={gradient.from} />
            <stop offset="1" stopColor={gradient.to} />
          </linearGradient>
        </defs>
      ) : null}
      <rect width="100%" height="100%" rx={radius} fill={gradient ? `url(#${gradientId})` : color} />
    </svg>
  );
}

export type SegmentBarItem = {
  key: string;
  value: number;
  color: string;
  label?: string;
};

export type SegmentBarProps = {
  segments: SegmentBarItem[];
  className?: string;
  onSelect?: (key: string) => void;
};

function SegmentRect({
  segment,
  onSelect,
}: {
  segment: SegmentBarItem & { x: number; width: number };
  onSelect?: (key: string) => void;
}) {
  function handleClick() {
    onSelect?.(segment.key);
  }
  return (
    <rect
      x={segment.x}
      y={0}
      width={segment.width}
      height={16}
      fill={segment.color}
      onClick={onSelect ? handleClick : undefined}
    >
      {segment.label ? <title>{segment.label}</title> : null}
    </rect>
  );
}

export function SegmentBar({ segments, className, onSelect }: SegmentBarProps) {
  const total =
    segments.reduce(function sum(amount, segment) {
      return amount + Math.max(0, segment.value);
    }, 0) || 1;
  const placed: Array<SegmentBarItem & { x: number; width: number }> = [];
  let x = 0;
  for (const segment of segments) {
    const width = (Math.max(0, segment.value) / total) * 100;
    if (width <= 0) continue;
    placed.push({ ...segment, x, width });
    x += width;
  }
  function renderSegment(segment: SegmentBarItem & { x: number; width: number }) {
        return <SegmentRect key={segment.key} segment={segment} onSelect={onSelect} />;
      }
  return (
    <svg className={cn("block h-4 w-full", className)} viewBox="0 0 100 16" preserveAspectRatio="none" role="img">
      {placed.map(renderSegment)}
    </svg>
  );
}
