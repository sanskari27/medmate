export function PtSpark({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const w = 220,
    h = 40,
    max = Math.max(...data, 1),
    min = Math.min(...data, 0),
    rng = max - min || 1;
  const pts = data.map(
    (v, i) => [(i / (data.length - 1)) * w, h - 3 - ((v - min) / rng) * (h - 8)] as const,
  );
  const line = `M ${pts.map((p) => p.join(",")).join(" L ")}`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height: 40 }}
      aria-hidden
    >
      <path d={`${line} L ${w},${h} L 0,${h} Z`} fill="var(--mid)" opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke="var(--mid)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {pts.map((pt, i) => (
        <circle key={i} cx={pt[0]} cy={pt[1]} r="2.4" fill="var(--mid)" />
      ))}
    </svg>
  );
}
