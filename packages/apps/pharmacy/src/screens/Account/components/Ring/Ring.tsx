export function Ring({ pct }: { pct: number }) {
  const r = 30,
    c = 2 * Math.PI * r,
    off = c * (1 - pct / 100);
  return (
    <div className="pd-acct-ring">
      <svg width={78} height={78} viewBox="0 0 78 78">
        <circle cx="39" cy="39" r={r} fill="none" stroke="var(--wash)" strokeWidth="8" />
        <circle
          cx="39"
          cy="39"
          r={r}
          fill="none"
          stroke="var(--mid)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 39 39)"
        />
      </svg>
      <span className="pd-acct-ring-val">{pct}%</span>
    </div>
  );
}
