import type { DonutArc, DonutRow } from "./DonutChart.types";

const OUTER = 92;
const INNER = 56;
export const DONUT_CENTER = 110;

export function polar(angle: number, radius: number): [number, number] {
  return [DONUT_CENTER + radius * Math.cos(angle), DONUT_CENTER + radius * Math.sin(angle)];
}

export function buildDonutArcs(rows: DonutRow[]): { total: number; arcs: DonutArc[] } {
  const total = rows.reduce(function sumAmounts(amount, row) {
    return amount + row.amt;
  }, 0);
  const arcs: DonutArc[] = [];
  let start = -Math.PI / 2;
  const visible = rows.filter(function hasAmount(row) {
    return row.amt > 0;
  });
  for (const row of visible) {
    const frac = row.amt / (total || 1);
    const end = start + frac * Math.PI * 2;
    const large = end - start > Math.PI ? 1 : 0;
    const [x0, y0] = polar(start, OUTER);
    const [x1, y1] = polar(end, OUTER);
    const [x2, y2] = polar(end, INNER);
    const [x3, y3] = polar(start, INNER);
    const d = `M ${x0} ${y0} A ${OUTER} ${OUTER} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${INNER} ${INNER} 0 ${large} 0 ${x3} ${y3} Z`;
    arcs.push({ ...row, d, frac });
    start = end;
  }
  return { total, arcs };
}
