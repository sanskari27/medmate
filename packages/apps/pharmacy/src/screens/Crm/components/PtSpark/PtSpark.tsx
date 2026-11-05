import { Sparkline } from "@/components/molecules/Sparkline";
import type { PtSparkProps } from "./PtSpark.types";

export function PtSpark({ data }: PtSparkProps) {
  if (data.length < 2) return null;
  return <Sparkline data={data} className="h-10 w-full" />;
}
