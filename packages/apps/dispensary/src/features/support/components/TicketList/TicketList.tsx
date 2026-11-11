import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconTicket } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { statusLabel, timeAgo, type SupportCase } from "../../model";

export function TicketList({
  items,
  onRaise,
  onOpen,
}: {
  items: SupportCase[];
  onRaise: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <section className="rounded-md border border-line bg-paper shadow-sm">
      <Box className="flex items-center justify-between gap-2.5 border-b border-line px-[18px] py-[15px]">
        <Heading level={3} className="text-[15px]">
          Support tickets
        </Heading>
        <Button size="sm" onClick={onRaise}>
          Raise ticket
        </Button>
      </Box>
      <Box className="px-[18px] py-1.5">
        {items.length === 0 ? (
          <Box className="px-6 py-6 text-center">
            <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-mid">
              <IconTicket size={22} />
            </Box>
            <Text className="text-muted">No tickets yet.</Text>
          </Box>
        ) : (
          items.map((item) => (
            <TicketRow key={item.id} item={item} onOpen={() => onOpen(item.id)} />
          ))
        )}
      </Box>
    </section>
  );
}

function TicketRow({ item, onOpen }: { item: SupportCase; onOpen: () => void }) {
  const resolved = item.status === "resolved";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 border-b border-line py-3 text-left last:border-b-0"
    >
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-wash text-mid">
        <IconTicket size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-bold text-ink">{item.subject}</span>
        <span className="text-xs text-muted">
          {item.ticketNumber} · {item.category} · {timeAgo(item.createdAt)}
        </span>
      </span>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap",
          resolved ? "bg-wash text-mid" : "bg-amber-bg text-gold-d",
        )}
      >
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {statusLabel(item.status)}
      </span>
    </button>
  );
}
