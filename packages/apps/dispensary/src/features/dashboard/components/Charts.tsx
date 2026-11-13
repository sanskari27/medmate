import { Box, Text } from "@/components/ui";

const SPARK_WIDTH = 132;
const SPARK_HEIGHT = 30;

export function Spark({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const steps = Math.max(1, data.length - 1);
  const points = data.map((value, index) => ({
    x: (index / steps) * SPARK_WIDTH,
    y: SPARK_HEIGHT - 2 - ((value - min) / range) * (SPARK_HEIGHT - 5),
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" L ");
  const last = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      className="block h-[30px] w-full"
    >
      <path
        d={`M ${line} L ${SPARK_WIDTH},${SPARK_HEIGHT} L 0,${SPARK_HEIGHT} Z`}
        fill="var(--color-mid)"
        opacity="0.12"
      />
      <path
        d={`M ${line}`}
        fill="none"
        stroke="var(--color-mid)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {last ? <circle cx={last.x} cy={last.y} r="2.6" fill="var(--color-mid)" /> : null}
    </svg>
  );
}

export function HBar({
  label,
  right,
  pct,
  color,
}: {
  label: string;
  right: string;
  pct: number;
  color: string;
}) {
  return (
    <Box className="mb-[11px]">
      <Box className="mb-1 flex items-center justify-between gap-2.5 text-[12.5px]">
        <Text as="span" className="font-semibold text-ink">
          {label}
        </Text>
        <Text as="span" className="text-muted">
          {right}
        </Text>
      </Box>
      <Box className="h-2 overflow-hidden rounded-[6px] bg-wash">
        <Box
          className="h-full rounded-[6px]"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
      </Box>
    </Box>
  );
}

type Slice = { key: string; label: string; color: string; amount: number };

export function SalesChart({
  slices,
  buckets,
  kind,
  format,
}: {
  slices: Slice[];
  buckets: { label: string; cash: number; credit: number }[];
  kind: "donut" | "group" | "line";
  format: (value: number) => string;
}) {
  const total = slices.reduce((sum, slice) => sum + slice.amount, 0);
  if (total <= 0) {
    return (
      <Text className="px-5 py-8 text-center text-[13px] text-muted">No sales in this period.</Text>
    );
  }
  if (kind === "donut") return <Donut slices={slices} total={total} format={format} />;
  if (kind === "line") return <LineChart buckets={buckets} format={format} />;
  return <GroupedBars buckets={buckets} format={format} />;
}

function Donut({
  slices,
  total,
  format,
}: {
  slices: Slice[];
  total: number;
  format: (value: number) => string;
}) {
  const radius = 72;
  const inner = 44;
  const cx = 90;
  const cy = 90;
  let start = -Math.PI / 2;
  const arcs = slices
    .filter((slice) => slice.amount > 0)
    .map((slice) => {
      const frac = slice.amount / total;
      const end = start + frac * Math.PI * 2;
      const large = end - start > Math.PI ? 1 : 0;
      const point = (angle: number, distance: number) => [
        cx + distance * Math.cos(angle),
        cy + distance * Math.sin(angle),
      ];
      const [x0, y0] = point(start, radius);
      const [x1, y1] = point(end, radius);
      const [x2, y2] = point(end, inner);
      const [x3, y3] = point(start, inner);
      const d = `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`;
      start = end;
      return { ...slice, d, frac };
    });
  return (
    <Box className="flex flex-wrap items-center justify-center gap-6 py-2">
      <svg
        viewBox="0 0 180 180"
        className="h-[180px] w-[180px]"
        role="img"
        aria-label="Cash and credit"
      >
        {arcs.map((arc) => (
          <path key={arc.key} d={arc.d} fill={arc.color}>
            <title>{`${arc.label}: ${format(arc.amount)}`}</title>
          </path>
        ))}
      </svg>
      <Box>
        {arcs.map((arc) => (
          <Text
            key={arc.key}
            className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-ink"
          >
            <span
              className="inline-block h-[11px] w-[11px] rounded-[3px]"
              style={{ background: arc.color }}
            />
            {arc.label} · {format(arc.amount)}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function GroupedBars({
  buckets,
  format,
}: {
  buckets: { label: string; cash: number; credit: number }[];
  format: (value: number) => string;
}) {
  const max = Math.max(...buckets.flatMap((bucket) => [bucket.cash, bucket.credit]), 1);
  return (
    <Box className="flex h-[180px] items-end gap-2 overflow-x-auto px-2 pt-2">
      {buckets.map((bucket) => (
        <Box key={bucket.label} className="flex min-w-8 flex-1 flex-col items-center gap-1">
          <Box className="flex h-[140px] items-end gap-1">
            <Box
              className="w-2.5 rounded-t-[3px] bg-gold"
              style={{ height: `${(bucket.cash / max) * 100}%` }}
              title={`Cash ${format(bucket.cash)}`}
            />
            <Box
              className="w-2.5 rounded-t-[3px] bg-mid"
              style={{ height: `${(bucket.credit / max) * 100}%` }}
              title={`Credit ${format(bucket.credit)}`}
            />
          </Box>
          <Text className="text-[10px] font-bold text-muted">{bucket.label}</Text>
        </Box>
      ))}
    </Box>
  );
}

function LineChart({
  buckets,
  format,
}: {
  buckets: { label: string; cash: number; credit: number }[];
  format: (value: number) => string;
}) {
  const width = 320;
  const height = 140;
  const max = Math.max(...buckets.flatMap((bucket) => [bucket.cash, bucket.credit]), 1);
  const path = (key: "cash" | "credit") => {
    if (buckets.length === 0) return "";
    const steps = Math.max(1, buckets.length - 1);
    return buckets
      .map((bucket, index) => {
        const x = (index / steps) * width;
        const y = height - (bucket[key] / max) * (height - 8) - 4;
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");
  };
  return (
    <svg
      viewBox={`0 0 ${width} ${height + 18}`}
      className="h-[180px] w-full"
      role="img"
      aria-label="Sales trend"
    >
      <path d={path("cash")} fill="none" stroke="var(--color-gold)" strokeWidth="2" />
      <path d={path("credit")} fill="none" stroke="var(--color-mid)" strokeWidth="2" />
      <title>
        {buckets
          .map((bucket) => `${bucket.label} ${format(bucket.cash)} / ${format(bucket.credit)}`)
          .join(", ")}
      </title>
    </svg>
  );
}

export function PurchaseChart({
  buckets,
}: {
  buckets: { label: string; sales: number; purchases: number }[];
}) {
  const active = buckets.some((bucket) => bucket.sales !== 0 || bucket.purchases !== 0);
  if (!active) {
    return (
      <Text className="px-5 py-8 text-center text-[13px] text-muted">
        No activity in this period.
      </Text>
    );
  }
  const max = Math.max(...buckets.flatMap((bucket) => [bucket.sales, bucket.purchases]), 1);
  return (
    <Box className="flex h-[160px] items-end gap-2 overflow-x-auto px-2">
      {buckets.map((bucket) => (
        <Box key={bucket.label} className="flex min-w-8 flex-1 flex-col items-center gap-1">
          <Box className="flex h-[120px] items-end gap-1">
            <Box
              className="w-2.5 rounded-t-[3px] bg-mid"
              style={{ height: `${(Math.max(bucket.sales, 0) / max) * 100}%` }}
            />
            <Box
              className="w-2.5 rounded-t-[3px] bg-gold"
              style={{ height: `${(Math.max(bucket.purchases, 0) / max) * 100}%` }}
            />
          </Box>
          <Text className="text-[10px] font-bold text-muted">{bucket.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
