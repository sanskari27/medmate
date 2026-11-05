import type { TrendGeometry } from "./TrendChart.types";

export function buildTrendGeometry(labelCount: number, rawMax: number): TrendGeometry {
  const width = 760;
  const height = 260;
  const padLeft = 52;
  const padRight = 14;
  const padTop = 12;
  const padBottom = 28;
  const plotWidth = width - padLeft - padRight;
  const plotHeight = height - padTop - padBottom;
  const power = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const max = Math.ceil(rawMax / power) * power || 1;
  const band = labelCount > 0 ? plotWidth / labelCount : plotWidth;
  return {
    width,
    height,
    padLeft,
    padRight,
    padTop,
    padBottom,
    plotHeight,
    max,
    band,
    grid: [0, 0.25, 0.5, 0.75, 1],
  };
}

export function centerX(geometry: TrendGeometry, index: number): number {
  return geometry.padLeft + geometry.band * (index + 0.5);
}

export function valueY(geometry: TrendGeometry, value: number): number {
  return geometry.padTop + geometry.plotHeight - (value / geometry.max) * geometry.plotHeight;
}
