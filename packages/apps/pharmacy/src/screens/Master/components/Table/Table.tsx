import type { TableProps } from "./Table.types";
import { Box, Table as TableAtom, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/atoms";
export function Table({ columns, empty, children, }: TableProps) {
    const count = Array.isArray(children) ? children.length : children ? 1 : 0;
    return (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
      <Box className="!overflow-x-auto">
        <TableAtom className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
          <TableHead>
            <TableRow>
              {columns.map(renderColumn)}
            </TableRow>
          </TableHead>
          <TableBody>
            {count === 0 ? (<TableRow>
                <TableCell colSpan={columns.length} className="!text-muted">
                  {empty}
                </TableCell>
              </TableRow>) : (children)}
          </TableBody>
        </TableAtom>
      </Box>
    </Box>);
    function renderColumn(column: string) {
        return (<TableHeaderCell key={column || "action"}>{column}</TableHeaderCell>);
    }
}
