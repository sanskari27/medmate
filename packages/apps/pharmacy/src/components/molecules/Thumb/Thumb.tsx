import type { InvProduct } from "@/utils";
import { Image } from "@/components/atoms/Image";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

export type ThumbProps = {
  p: InvProduct;
  className?: string;
};

function monogram(name: string): string {
  const character = name.trim().charAt(0);
  return character ? character.toUpperCase() : "•";
}

export function Thumb({ p, className }: ThumbProps) {
  if (p.image) {
    return (
      <Image
        data-slot="thumb"
        src={p.image}
        alt={p.name}
        fit="cover"
        className={cn("block h-full w-full rounded-[inherit]", className)}
      />
    );
  }
  return (
    <Text data-slot="thumb" as="span" className={cn("font-bold text-mid", className)}>
      {monogram(p.name)}
    </Text>
  );
}
