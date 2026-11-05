export function Spark({ data, color = "var(--mid)" }: { data: number[]; color?: string }) {
  const w = 132,
    h = 30,
    max = Math.max(...data, 1),
    min = Math.min(...data, 0),
    rng = max - min || 1;
  const pts = data.map(
    (v, i) =>
      [(i / Math.max(1, data.length - 1)) * w, h - 2 - ((v - min) / rng) * (h - 5)] as const,
  );
  const line = `M ${pts.map((p) => p.join(",")).join(" L ")}`;
  const area = `${line} L ${w},${h} L 0,${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg className="pd-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <path d={area} fill={color} opacity="0.12" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {last && <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />}
    </svg>
  );
}
