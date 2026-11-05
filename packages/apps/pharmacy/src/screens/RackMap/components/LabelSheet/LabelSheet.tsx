import type { LabelSheetProps } from "./LabelSheet.types";
import { Box, Button, Heading, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { MouseEvent } from "react";
import { InvProduct } from "@/utils";
import { IconPrint, IconX } from "@/components/atoms";

const labelPrint = `
@media print {
  body * { visibility: hidden !important; }
  .rack-print-area, .rack-print-area * { visibility: visible !important; }
  .rack-print-area {
    position: fixed;
    inset: 0;
    margin: 0;
    padding: 22px;
    box-shadow: none;
    border: 0;
    max-width: none;
    width: 100%;
    max-height: none;
    background: #fff;
  }
  .rack-label-gold { color: #d9a648 !important; }
  .rack-label-dark { color: #1b3d29 !important; }
  .rack-label-code { color: #000 !important; }
}
`;

export function LabelSheet({ groups, onClose }: LabelSheetProps) {
  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
      onClick={onClose}
    >
      <style>{labelPrint}</style>
      <Box
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-2xl max-[767px]:rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px] print:hidden">
          <Heading level={3}>Rack labels · {groups.length} locations</Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Text className={cn("!text-muted print:hidden", "!text-[12.5px] !mb-3")}>
            Print, cut along the boxes, and stick each label on its matching bin. The code must read
            identically on the shelf and on screen.
          </Text>
          <Box className="rack-print-area grid grid-cols-3 gap-2.5 max-[1099px]:grid-cols-2 max-[767px]:grid-cols-1">
            {groups.map(renderGroup)}
          </Box>
        </Box>
        <Box className="mt-auto flex justify-end gap-2.5 border-t border-line px-5 py-3.5 print:hidden max-[767px]:flex-wrap max-[767px]:[&_button]:flex-1">
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            onClick={printOnClick}
          >
            <IconPrint size={15} /> Print labels
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function renderGroup(g: { code: string; zone: string; items: InvProduct[] }) {
    return (
      <Box
        className="!rounded-sm !border-[1.5px] !border-dashed !border-[#999] !px-2.5 !py-3.5 !text-center"
        key={g.code}
      >
        <Box className="text-[10px] font-bold tracking-[0.12em] text-[#666]">RACK {g.zone}</Box>
        <Box className="rack-label-code my-1 font-mono text-[30px] font-extrabold tracking-[0.04em] text-[#111]">
          {g.code}
        </Box>
        <Box className="font-display text-[11px] font-extrabold tracking-[-0.01em]">
          <Text
            as="span"
            className="rack-label-gold !text-[11px] !font-extrabold !text-gold not-italic"
          >
            Namma
          </Text>{" "}
          <Text as="span" className="rack-label-dark !text-[11px] !font-extrabold !text-dark">
            MedMate
          </Text>
        </Box>
      </Box>
    );
  }
  function printOnClick() {
    return window.print();
  }
}
