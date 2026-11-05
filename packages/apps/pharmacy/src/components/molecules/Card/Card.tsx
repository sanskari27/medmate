import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { Box } from "@/components/atoms/Box";
import { cn } from "@/utils/className";

const cardVariants = cva("overflow-hidden border border-line bg-paper shadow-card", {
  variants: {
    radius: {
      md: "rounded-md",
      lg: "rounded-lg",
    },
    padding: {
      none: "",
      md: "",
    },
  },
  defaultVariants: {
    radius: "lg",
  },
});

export type CardProps = ComponentProps<typeof Box> & VariantProps<typeof cardVariants>;

export function Card({ className, radius, padding, ...props }: CardProps) {
  return (
    <Box data-slot="card" className={cn(cardVariants({ radius, padding }), className)} {...props} />
  );
}

export { cardVariants };
export { CardBody } from "../CardBody";
export { CardHeader } from "../CardHeader";
export type { CardBodyProps } from "../CardBody";
export type { CardHeaderProps } from "../CardHeader";
