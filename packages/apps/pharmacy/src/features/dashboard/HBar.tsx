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
    <div style={{ marginBottom: 11 }}>
      <div
        className="pd-flex"
        style={{ justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}
      >
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span className="pd-muted">{right}</span>
      </div>
      <div style={{ height: 8, background: "var(--wash)", borderRadius: 6, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${Math.max(2, pct)}%`,
            background: color,
            borderRadius: 6,
            transition: "width .25s",
          }}
        />
      </div>
    </div>
  );
}
