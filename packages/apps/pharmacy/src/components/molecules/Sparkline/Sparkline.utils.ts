export const SPARK_WIDTH = 132;
export const SPARK_HEIGHT = 30;

export type SparkPoint = {
  x: number;
  y: number;
};

export function sparkPoints(data: number[]): SparkPoint[] {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const steps = Math.max(1, data.length - 1);
  const points: SparkPoint[] = [];
  for (let index = 0; index < data.length; index += 1) {
    const value = data[index] ?? 0;
    points.push({
      x: (index / steps) * SPARK_WIDTH,
      y: SPARK_HEIGHT - 2 - ((value - min) / range) * (SPARK_HEIGHT - 5),
    });
  }
  return points;
}

export function sparkLinePath(points: SparkPoint[]): string {
  if (points.length === 0) return "";
  const parts: string[] = [];
  for (const point of points) {
    parts.push(`${point.x},${point.y}`);
  }
  return `M ${parts.join(" L ")}`;
}

export function sparkAreaPath(points: SparkPoint[]): string {
  const line = sparkLinePath(points);
  if (!line) return "";
  return `${line} L ${SPARK_WIDTH},${SPARK_HEIGHT} L 0,${SPARK_HEIGHT} Z`;
}
