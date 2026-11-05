import type { ComponentProps } from "react";
import { Box } from "@/components/atoms/Box";
import { cn } from "@/utils/className";

export type CardBodyProps = ComponentProps<typeof Box>;

export function CardBody({ className, ...props }: CardBodyProps) {
  return <Box data-slot="card-body" className={cn("px-4 pb-4", className)} {...props} />;
}
