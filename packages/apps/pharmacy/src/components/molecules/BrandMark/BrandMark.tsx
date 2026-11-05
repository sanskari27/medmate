import { useId, type ComponentProps } from "react";
import { Box } from "@/components/atoms/Box";
import { cn } from "@/utils/className";

export type BrandMarkProps = ComponentProps<typeof Box>;

export function BrandMark({ className, ...props }: BrandMarkProps) {
  const gradientId = useId().replace(/:/g, "");
  return (
    <Box
      data-slot="brand-mark"
      className={cn(
        "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-paper shadow-[0_4px_12px_#00000040]",
        className,
      )}
      {...props}
    >
      <svg width={24} height={24} viewBox="0 0 40 40" fill="none" aria-hidden>
        <defs>
          <linearGradient
            id={gradientId}
            x1="6"
            y1="4"
            x2="34"
            y2="36"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#4A9E6E" />
            <stop offset="1" stopColor="#1B3D29" />
          </linearGradient>
        </defs>
        <path
          d="M20 3.5C12.5 3.5 6.5 9.3 6.5 17c0 8.6 10.7 17.3 12.7 18.8a1.4 1.4 0 0 0 1.6 0C22.8 34.3 33.5 25.6 33.5 17 33.5 9.3 27.5 3.5 20 3.5Z"
          fill={`url(#${gradientId})`}
        />
        <circle cx="20" cy="16.5" r="8.7" fill="#fff" />
        <path d="M18 10.5h4V14h3.5v4H22v3.5h-4V18h-3.5v-4H18z" fill="#2F7D52" />
        <circle cx="27" cy="9" r="3" fill="#D9A648" stroke="#fff" strokeWidth="1.4" />
      </svg>
    </Box>
  );
}
