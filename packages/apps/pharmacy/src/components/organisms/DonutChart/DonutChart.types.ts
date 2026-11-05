export type DonutRow = {
  key: string;
  label: string;
  color: string;
  amt: number;
};

export type DonutArc = DonutRow & {
  d: string;
  frac: number;
};

export type DonutChartProps = {
  rows: DonutRow[];
  fmt: (value: number) => string;
  className?: string;
};
