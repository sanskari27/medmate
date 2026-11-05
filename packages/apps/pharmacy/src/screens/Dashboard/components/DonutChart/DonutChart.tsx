export function DonutChart({
  rows,
  fmt,
}: {
  rows: { key: string; label: string; color: string; amt: number }[];
  fmt: (n: number) => string;
}) {
  const total = rows.reduce((a, r) => a + r.amt, 0);
  const R = 92,
    r = 56,
    cx = 110,
    cy = 110;
  const polar = (ang: number, rad: number) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
  let a0 = -Math.PI / 2;
  const arcs = rows
    .filter((x) => x.amt > 0)
    .map((x) => {
      const frac = x.amt / (total || 1);
      const a1 = a0 + frac * Math.PI * 2;
      const large = a1 - a0 > Math.PI ? 1 : 0;
      const [x0, y0] = polar(a0, R),
        [x1, y1] = polar(a1, R),
        [x2, y2] = polar(a1, r),
        [x3, y3] = polar(a0, r);
      const d = `M ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${r} ${r} 0 ${large} 0 ${x3} ${y3} Z`;
      a0 = a1;
      return { ...x, d, frac };
    });
  return (
    <div
      className="pd-flex"
      style={{
        gap: 24,
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 0",
      }}
    >
      {total <= 0 ? (
        <div className="pd-empty" style={{ padding: 30 }}>
          <p>No data for the selected sources.</p>
        </div>
      ) : (
        <>
          <svg viewBox="0 0 220 220" style={{ width: 260, height: 260, flexShrink: 0 }} role="img">
            {arcs.map((s) => (
              <path key={s.key} d={s.d} fill={s.color}>
                <title>{`${s.label}: ${fmt(s.amt)} · ${Math.round(s.frac * 100)}%`}</title>
              </path>
            ))}
            <text
              x={cx}
              y={cy - 4}
              textAnchor="middle"
              style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 19, fill: "var(--dark)" }}
            >
              {fmt(total)}
            </text>
            <text x={cx} y={cy + 15} textAnchor="middle" className="ax">
              total
            </text>
          </svg>
          <div
            style={{
              minWidth: 210,
              maxWidth: 300,
              flex: "0 1 260px",
              background: "var(--wash2)",
              borderRadius: 12,
              padding: "10px 14px",
            }}
          >
            {arcs.map((s) => (
              <div
                className="pd-flex"
                key={s.key}
                style={{ justifyContent: "space-between", marginBottom: 9, fontSize: 12.5 }}
              >
                <span className="pd-flex" style={{ gap: 8, fontWeight: 600 }}>
                  <i
                    style={{
                      width: 11,
                      height: 11,
                      borderRadius: 3,
                      background: s.color,
                      display: "inline-block",
                    }}
                  />
                  {s.label}
                </span>
                <span className="pd-muted">
                  {fmt(s.amt)} · {Math.round(s.frac * 100)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
