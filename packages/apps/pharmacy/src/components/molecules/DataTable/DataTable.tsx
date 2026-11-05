import type { ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Table, TableBody, TableHead } from "@/components/atoms";
import { cn } from "@/utils/className";
import { EmptyState } from "@/components/molecules/EmptyState";
import { TableFooter } from "../TableFooter";

export type DataTableProps = {
  head?: ReactNode;
  children?: ReactNode;
  emptyTitle?: string;
  emptyBody?: string;
  isEmpty?: boolean;
  className?: string;
  footer?: ReactNode;
};

export function DataTable({
  head,
  children,
  emptyTitle,
  emptyBody,
  isEmpty = false,
  className,
  footer,
}: DataTableProps) {
  return (
    <Box data-slot="data-table" className={cn("overflow-x-auto", className)}>
      <Table>
        {head ? <TableHead>{head}</TableHead> : null}
        <TableBody>{isEmpty ? null : children}</TableBody>
      </Table>
      {isEmpty && emptyTitle ? <EmptyState title={emptyTitle} body={emptyBody} /> : null}
      {footer ? <TableFooter>{footer}</TableFooter> : null}
    </Box>
  );
}
