import type { RackGroup } from "../model";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { IconPrint, IconX } from "@/components/ui/Icon";

const labelPrint = `
@media print {
  body * { visibility: hidden !important; }
  .rack-print-area, .rack-print-area * { visibility: visible !important; }
  .rack-print-area {
    position: fixed;
    inset: 0;
    margin: 0;
    padding: 22px;
    background: #fff;
  }
}
`;

export function LabelSheet({ groups, onClose }: { groups: RackGroup[]; onClose: () => void }) {
  return (
    <Box
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <style>{labelPrint}</style>
      <Box
        role="dialog"
        aria-modal="true"
        aria-label="Rack labels"
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Box className="flex items-center justify-between border-b border-line px-5 py-4 print:hidden">
          <Heading level={3} className="text-[17px]">
            Rack labels · {groups.length} locations
          </Heading>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="overflow-y-auto p-5">
          <Text className="mb-3 text-[12.5px] text-muted print:hidden">
            Print, cut along the boxes, and stick each label on its matching bin. The code must read
            identically on the shelf and on screen.
          </Text>
          <Box className="rack-print-area grid grid-cols-3 gap-2.5">
            {groups.map((group) => (
              <Box
                key={group.code}
                className="rounded-sm border-[1.5px] border-dashed border-[#999] px-2.5 py-3.5 text-center"
              >
                <Text className="text-[10px] font-bold tracking-[0.12em] text-[#666]">
                  RACK {group.zone}
                </Text>
                <Text className="my-1 font-mono text-[30px] font-extrabold tracking-[0.04em] text-[#111]">
                  {group.code}
                </Text>
                <Text className="font-display text-[11px] font-extrabold">
                  <span className="text-gold">Namma</span>{" "}
                  <span className="text-dark">MedMate</span>
                </Text>
              </Box>
            ))}
          </Box>
        </Box>
        <Box className="flex justify-end gap-2.5 border-t border-line px-5 py-3.5 print:hidden">
          <Button type="button" variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <IconPrint size={15} /> Print labels
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
