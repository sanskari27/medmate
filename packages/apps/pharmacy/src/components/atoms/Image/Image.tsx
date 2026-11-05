import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const imageVariants = cva("max-w-full", {
  variants: {
    fit: {
      contain: "object-contain",
      cover: "object-cover",
    },
    rounded: {
      none: "",
      sm: "rounded-sm",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    fit: "contain",
    rounded: "none",
  },
});

export type ImageProps = ComponentProps<"img"> &
  VariantProps<typeof imageVariants> & { alt: string };

export function Image({ className, fit, rounded, alt, ...props }: ImageProps) {
  return (
    <img
      data-slot="image"
      alt={alt}
      className={cn(imageVariants({ fit, rounded }), className)}
      {...props}
    />
  );
}

export { imageVariants };
