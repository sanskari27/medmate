import { sparklineGeometry } from "@/screens/Crm/Crm.utils";
import type { PtSparkProps } from "./PtSpark.types";

export function PtSpark({ data }: PtSparkProps) {
  if (data.length < 2) return null;
  const { width, height, line, points } = sparklineGeometry(data);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-10 w-full text-mid"
      aria-hidden
    >
      <path d={`${line} L ${width},${height} L 0,${height} Z`} fill="currentColor" opacity="0.1" />
      <path
        d={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <SparkDots points={points} />
    </svg>
  );
}

function SparkDots({ points }: { points: { x: number; y: number }[] }) {
  return points.map(function renderDot(point, index) {
    return <circle key={index} cx={point.x} cy={point.y} r="2.4" fill="currentColor" />;
  });
}
