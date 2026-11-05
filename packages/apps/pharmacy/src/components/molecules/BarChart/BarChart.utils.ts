export const BAR_WIDTH = 320;
export const BAR_HEIGHT = 180;
export const BAR_LABEL_BAND = 22;
export const BAR_PLOT_TOP = 8;
export const BAR_COLUMN_GAP = 12;
export const BAR_MAX_WIDTH = 34;
export const BAR_MIN_STACK = 4;
export const BAR_RADIUS = 6;

export type BarTone = "on" | "off";

export type BarSegmentInput = {
  value: number;
  tone: BarTone;
  fill?: string;
};

export type BarColumnInput = {
  label: string;
  segments: BarSegmentInput[];
};

export type BarRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  tone: BarTone;
  fill?: string;
};

export type BarColumnLayout = {
  label: string;
  labelX: number;
  labelY: number;
  clip: { x: number; y: number; width: number; height: number; radius: number };
  rects: BarRect[];
};

export type BarLayout = {
  width: number;
  height: number;
  columns: BarColumnLayout[];
};

function columnTotal(column: BarColumnInput): number {
  let total = 0;
  for (const segment of column.segments) {
    if (segment.value > 0) total += segment.value;
  }
  return total;
}

export function layoutBars(columns: BarColumnInput[], width = BAR_WIDTH): BarLayout {
  const totals: number[] = [];
  let max = 1;
  for (const column of columns) {
    const total = columnTotal(column);
    totals.push(total);
    if (total > max) max = total;
  }
  const count = Math.max(columns.length, 1);
  const slot = width / count;
  const barWidth = Math.min(BAR_MAX_WIDTH, Math.max(4, slot - BAR_COLUMN_GAP));
  const plotHeight = BAR_HEIGHT - BAR_LABEL_BAND - BAR_PLOT_TOP;
  const layouts: BarColumnLayout[] = [];
  for (let index = 0; index < columns.length; index += 1) {
    const column = columns[index];
    if (!column) continue;
    const total = totals[index] ?? 0;
    const stackHeight =
      total <= 0 ? BAR_MIN_STACK : Math.max(BAR_MIN_STACK, (total / max) * plotHeight);
    const labelX = slot * index + slot / 2;
    const x = labelX - barWidth / 2;
    const top = BAR_HEIGHT - BAR_LABEL_BAND - stackHeight;
    const rects: BarRect[] = [];
    let y = top;
    if (total > 0) {
      for (const segment of column.segments) {
        if (segment.value <= 0) continue;
        const height = (segment.value / total) * stackHeight;
        rects.push({ x, y, width: barWidth, height, tone: segment.tone, fill: segment.fill });
        y += height;
      }
    }
    layouts.push({
      label: column.label,
      labelX,
      labelY: BAR_HEIGHT - 4,
      clip: { x, y: top, width: barWidth, height: stackHeight, radius: BAR_RADIUS },
      rects,
    });
  }
  return { width, height: BAR_HEIGHT, columns: layouts };
}
