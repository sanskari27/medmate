import type { ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { cn } from "@/utils/className";

export type TableFooterProps = {
  children?: ReactNode;
  className?: string;
};

export function TableFooter({ children, className }: TableFooterProps) {
  return (
    <Box
      data-slot="table-footer"
      className={cn("border-t border-line-2 bg-wash-2 px-3.5 py-2.5 text-[12.5px] font-extrabold text-ink-2", className)}
    >
      {children}
    </Box>
  );
}
