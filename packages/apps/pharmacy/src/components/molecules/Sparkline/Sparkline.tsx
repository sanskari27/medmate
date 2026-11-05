import type { ComponentProps } from "react";
import { cn } from "@/utils/className";
import { SPARK_HEIGHT, SPARK_WIDTH, sparkAreaPath, sparkLinePath, sparkPoints } from "./Sparkline.utils";

export type SparklineProps = Omit<ComponentProps<"svg">, "children"> & {
  data: number[];
  color?: string;
};

export function Sparkline({ data, color = "var(--color-mid)", className, ...props }: SparklineProps) {
  const points = sparkPoints(data);
  const line = sparkLinePath(points);
  const area = sparkAreaPath(points);
  const last = points[points.length - 1];
  return (
    <svg
      data-slot="sparkline"
      viewBox={`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`}
      preserveAspectRatio="none"
      aria-hidden
      className={cn("block h-[30px] w-full", className)}
      {...props}
    >
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
      {last ? <circle cx={last.x} cy={last.y} r="2.6" fill={color} /> : null}
    </svg>
  );
}
