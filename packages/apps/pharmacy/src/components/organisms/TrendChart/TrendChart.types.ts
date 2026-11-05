import type { SaleSource } from "@/utils";

export type TrendSeries = {
  key: SaleSource;
  label: string;
  color: string;
  rev: number[];
  ord: number[];
};

export type TrendChartProps = {
  labels: string[];
  series: TrendSeries[];
  type: "group" | "line";
  valOf: (series: TrendSeries, index: number) => number;
  fmtAxis: (value: number) => string;
  fmt: (value: number) => string;
  className?: string;
};

export type TrendGeometry = {
  width: number;
  height: number;
  padLeft: number;
  padRight: number;
  padTop: number;
  padBottom: number;
  plotHeight: number;
  max: number;
  band: number;
  grid: number[];
};
