import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import type { Faq } from "../../model";

export function FaqList({
  items,
  openId,
  onToggle,
}: {
  items: Faq[];
  openId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="rounded-md border border-line bg-paper shadow-sm">
      <Box className="border-b border-line px-[18px] py-[15px]">
        <Heading level={3} className="text-[15px]">
          Frequently asked
        </Heading>
      </Box>
      <Box className="px-[18px] py-1.5">
        {items.length === 0 ? (
          <Text className="py-6 text-center text-muted">No FAQs yet.</Text>
        ) : (
          items.map((faq) => (
            <FaqRow
              key={faq.id}
              faq={faq}
              open={openId === faq.id}
              onToggle={() => onToggle(faq.id)}
            />
          ))
        )}
      </Box>
    </section>
  );
}

function FaqRow({ faq, open, onToggle }: { faq: Faq; open: boolean; onToggle: () => void }) {
  return (
    <Box className="border-b border-line">
      <Button
        variant="ghost"
        onClick={onToggle}
        className="h-auto w-full justify-between gap-2.5 rounded-none border-0 bg-transparent px-0 py-3 text-left font-normal text-ink shadow-none hover:bg-transparent active:translate-y-0"
      >
        <Text as="span" className="text-[13.5px] font-bold">
          {faq.question}
        </Text>
        <Text
          as="span"
          className={cn("text-[16px] text-muted transition", open ? "rotate-45" : "rotate-0")}
        >
          +
        </Text>
      </Button>
      {open ? (
        <Text className="pb-3 text-[13px] leading-[1.55] text-muted">{faq.answer}</Text>
      ) : null}
    </Box>
  );
}
