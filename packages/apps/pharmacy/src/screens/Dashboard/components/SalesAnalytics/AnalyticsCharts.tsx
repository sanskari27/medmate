type DonutRow = { key: string; label: string; color: string; amt: number };

export function AnalyticsDonut({ rows, fmt }: { rows: DonutRow[]; fmt: (n: number) => string }) {
  const total = rows.reduce((sum, row) => sum + row.amt, 0);
  const radius = 92;
  const inner = 56;
  const cx = 110;
  const cy = 110;
  const polar = (angle: number, distance: number) => [
    cx + distance * Math.cos(angle),
    cy + distance * Math.sin(angle),
  ];
  let start = -Math.PI / 2;
  const arcs = rows
    .filter((row) => row.amt > 0)
    .map((row) => {
      const frac = row.amt / (total || 1);
      const end = start + frac * Math.PI * 2;
      const large = end - start > Math.PI ? 1 : 0;
      const [x0, y0] = polar(start, radius);
      const [x1, y1] = polar(end, radius);
      const [x2, y2] = polar(end, inner);
      const [x3, y3] = polar(start, inner);
      const d = `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`;
      start = end;
      return { ...row, d, frac };
    });

  if (total <= 0) {
    return (
      <div className="p-[30px] text-center text-muted">
        <p className="mx-auto max-w-[340px] text-[13px]">No data for the selected sources.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-6 py-1.5">
      <svg viewBox="0 0 220 220" className="h-[260px] w-[260px] shrink-0" role="img">
        {arcs.map((arc) => (
          <path key={arc.key} d={arc.d} fill={arc.color}>
            <title>{`${arc.label}: ${fmt(arc.amt)} · ${Math.round(arc.frac * 100)}%`}</title>
          </path>
        ))}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          style={{
            fontFamily: "Manrope, Inter, sans-serif",
            fontWeight: 800,
            fontSize: 19,
            fill: "var(--color-dark)",
          }}
        >
          {fmt(total)}
        </text>
        <text
          x={cx}
          y={cy + 15}
          textAnchor="middle"
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: 10,
            fill: "var(--color-faint)",
          }}
        >
          total
        </text>
      </svg>
      <div className="max-w-[300px] min-w-[210px] flex-[0_1_260px] rounded-md bg-wash-2 px-3.5 py-2.5">
        {arcs.map((arc) => (
          <div
            key={arc.key}
            className="mb-[9px] flex items-center justify-between gap-2.5 text-[12.5px] last:mb-[9px]"
          >
            <span className="flex items-center gap-2 font-semibold">
              <i
                className="inline-block h-[11px] w-[11px] rounded-[3px]"
                style={{ background: arc.color }}
              />
              {arc.label}
            </span>
            <span className="text-muted">
              {fmt(arc.amt)} · {Math.round(arc.frac * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

type TrendSeries = { key: string; label: string; color: string };

export function AnalyticsTrend<T extends TrendSeries>({
  labels,
  series,
  type,
  valOf,
  fmtAxis,
  fmt,
}: {
  labels: string[];
  series: T[];
  type: "group" | "line";
  valOf: (series: T, index: number) => number;
  fmtAxis: (n: number) => string;
  fmt: (n: number) => string;
}) {
  const width = 760;
  const height = 260;
  const padLeft = 52;
  const padRight = 14;
  const padTop = 12;
  const padBottom = 28;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const count = labels.length;
  const rawMax = Math.max(
    1,
    ...series.flatMap((item) => labels.map((_, index) => valOf(item, index))),
  );
  const power = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil(rawMax / power) * power || 1;
  const band = plotWidth / count;
  const centerX = (index: number) => padLeft + band * (index + 0.5);
  const valueY = (value: number) => padTop + plotHeight - (value / max) * plotHeight;
  const grid = [0, 0.25, 0.5, 0.75, 1];
  const axisStyle = {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: 10,
    fill: "var(--color-faint)",
  };

  if (series.length === 0) {
    return (
      <div className="p-[30px] text-center text-muted">
        <p className="mx-auto max-w-[340px] text-[13px]">Select at least one source above.</p>
      </div>
    );
  }

  return (
    <svg
      className="block h-auto w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      {grid.map((fraction) => (
        <g key={fraction}>
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={padTop + plotHeight * (1 - fraction)}
            y2={padTop + plotHeight * (1 - fraction)}
            stroke="var(--color-line)"
            strokeWidth={1}
          />
          <text
            x={padLeft - 8}
            y={padTop + plotHeight * (1 - fraction) + 3.5}
            textAnchor="end"
            style={axisStyle}
          >
            {fmtAxis(max * fraction)}
          </text>
        </g>
      ))}
      {labels.map((label, index) => (
        <text
          key={label + index}
          x={centerX(index)}
          y={height - 9}
          textAnchor="middle"
          style={axisStyle}
        >
          {label}
        </text>
      ))}
      {type === "group" &&
        labels.map((_, index) => {
          const groupWidth = band * 0.72;
          const barWidth = groupWidth / series.length;
          return series.map((item, seriesIndex) => {
            const value = valOf(item, index);
            const x = centerX(index) - groupWidth / 2 + seriesIndex * barWidth;
            const y = valueY(value);
            return (
              <rect
                key={item.key + index}
                x={x + 1}
                y={y}
                width={Math.max(1, barWidth - 2)}
                height={Math.max(0, plotHeight + padTop - y)}
                fill={item.color}
                rx={1.5}
              >
                <title>{`${labels[index]} · ${item.label}: ${fmt(value)}`}</title>
              </rect>
            );
          });
        })}
      {type === "line" &&
        series.map((item) => {
          const points = labels.map(
            (_, index) => [centerX(index), valueY(valOf(item, index))] as const,
          );
          return (
            <g key={item.key}>
              <polyline
                points={points.map((point) => point.join(",")).join(" ")}
                fill="none"
                stroke={item.color}
                strokeWidth={2.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map((point, index) => (
                <circle
                  key={index}
                  cx={point[0]}
                  cy={point[1]}
                  r={3}
                  fill="#fff"
                  stroke={item.color}
                  strokeWidth={2}
                >
                  <title>{`${labels[index]} · ${item.label}: ${fmt(valOf(item, index))}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
    </svg>
  );
}
