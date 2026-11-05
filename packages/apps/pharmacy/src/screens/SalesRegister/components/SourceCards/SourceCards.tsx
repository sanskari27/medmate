import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import { SaleSourceIcon } from "@/components/molecules/EntityMark";
import { inr, type SaleSource } from "@/utils";
import { cn } from "@/utils/className";
import type { SourceCard } from "../../SalesRegister.utils";
import type { SourceCardsProps } from "./SourceCards.types";

export function SourceCards({ cards, selected, onSelect }: SourceCardsProps) {
  function renderCard(card: SourceCard) {
    return (
      <SourceButton
        key={card.key}
        card={card}
        selected={selected === card.key}
        onSelect={onSelect}
      />
    );
  }
  return (
    <Box className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
      {cards.map(renderCard)}
    </Box>
  );
}

function SourceButton({
  card,
  selected,
  onSelect,
}: {
  card: SourceCard;
  selected: boolean;
  onSelect: (source: SaleSource) => void;
}) {
  function choose() {
    onSelect(card.key);
  }
  return (
    <Button
      variant="ghost"
      onClick={choose}
      className={cn(
        "!h-auto !w-full !items-stretch !justify-start !whitespace-normal !rounded-md !bg-paper !p-[18px] !text-left !font-normal !text-ink !transition-[border-color,box-shadow] !duration-150 hover:!bg-paper active:!translate-y-0",
        selected
          ? "!border-mid !shadow-[0_0_0_3px_rgba(47,125,82,0.14)] hover:!border-mid"
          : "!border-line !shadow-sm hover:!border-light",
      )}
    >
      <Stack className="w-full">
        <Stack direction="row" align="center" justify="between">
          <SaleSourceIcon k={card.key} size={16} />
          <Text as="span" className="text-[12px] font-bold text-muted">
            {card.count}
          </Text>
        </Stack>
        <Text className="mt-1.5 font-display text-[18px] font-extrabold text-ink">
          {inr(card.amount)}
        </Text>
        <Text as="span" className="text-[12px] leading-[1.5] font-normal text-muted">
          {card.label}
        </Text>
      </Stack>
    </Button>
  );
}
