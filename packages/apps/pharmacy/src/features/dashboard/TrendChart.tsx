import { SaleSource } from "@/domain";

type Series = { key: SaleSource; label: string; color: string; rev: number[]; ord: number[] };

export function TrendChart({
  labels,
  series,
  type,
  valOf,
  fmtAxis,
  fmt,
}: {
  labels: string[];
  series: Series[];
  type: "group" | "line";
  valOf: (s: Series, i: number) => number;
  fmtAxis: (n: number) => string;
  fmt: (n: number) => string;
}) {
  const W = 760,
    H = 260,
    padL = 52,
    padR = 14,
    padT = 12,
    padB = 28;
  const plotW = W - padL - padR,
    plotH = H - padT - padB;
  const n = labels.length;
  const rawMax = Math.max(1, ...series.flatMap((s) => labels.map((_, i) => valOf(s, i))));
  // round max up to a "nice" number
  const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil(rawMax / pow) * pow || 1;
  const band = plotW / n;
  const cx = (i: number) => padL + band * (i + 0.5);
  const y = (v: number) => padT + plotH - (v / max) * plotH;
  const grid = [0, 0.25, 0.5, 0.75, 1];

  if (series.length === 0)
    return (
      <div className="pd-empty" style={{ padding: 30 }}>
        <p>Select at least one source above.</p>
      </div>
    );

  return (
    <svg
      className="pd-chartsvg"
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      {/* gridlines + y labels */}
      {grid.map((g) => (
        <g key={g}>
          <line
            x1={padL}
            x2={W - padR}
            y1={padT + plotH * (1 - g)}
            y2={padT + plotH * (1 - g)}
            stroke="var(--line)"
            strokeWidth={1}
          />
          <text x={padL - 8} y={padT + plotH * (1 - g) + 3.5} textAnchor="end" className="ax">
            {fmtAxis(max * g)}
          </text>
        </g>
      ))}
      {/* x labels */}
      {labels.map((d, i) => (
        <text key={d + i} x={cx(i)} y={H - 9} textAnchor="middle" className="ax">
          {d}
        </text>
      ))}

      {/* grouped bars */}
      {type === "group" &&
        labels.map((_, i) => {
          const m = series.length;
          const gw = band * 0.72;
          const bw = gw / m;
          return series.map((s, si) => {
            const v = valOf(s, i);
            const x = cx(i) - gw / 2 + si * bw;
            const yTop = y(v);
            return (
              <rect
                key={s.key + i}
                x={x + 1}
                y={yTop}
                width={Math.max(1, bw - 2)}
                height={Math.max(0, plotH + padT - yTop)}
                fill={s.color}
                rx={1.5}
              >
                <title>{`${labels[i]} · ${s.label}: ${fmt(v)}`}</title>
              </rect>
            );
          });
        })}

      {/* line */}
      {type === "line" &&
        series.map((s) => {
          const pts = labels.map((_, i) => [cx(i), y(valOf(s, i))] as const);
          return (
            <g key={s.key}>
              <polyline
                points={pts.map((p) => p.join(",")).join(" ")}
                fill="none"
                stroke={s.color}
                strokeWidth={2.4}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r={3}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                >
                  <title>{`${labels[i]} · ${s.label}: ${fmt(valOf(s, i))}`}</title>
                </circle>
              ))}
            </g>
          );
        })}
    </svg>
  );
}
