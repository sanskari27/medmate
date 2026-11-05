import * as React from "react";
import { Avatar as AvatarAtom } from "@/components/atoms/Avatar";
import { avatarSizeFromPixels, initialsOf } from "./EntityMark.utils";
import {
  IconAlert,
  IconBandage,
  IconBed,
  IconBolt,
  IconBowl,
  IconBox,
  IconBaby,
  IconCart,
  IconClipboard,
  IconDoc,
  IconDroplet,
  IconGlobe,
  IconReceipt,
  IconHeart,
  IconLeaf,
  IconPill,
  IconRefresh,
  IconSparkle,
  IconStar,
  IconStore,
  IconSun,
  IconThermometer,
  IconToothbrush,
  IconTrendUp,
  IconTruck,
  IconUser,
  IconWallet,
  IconWatch,
  IconWind,
} from "@/components/atoms";

export type IconC = (p: { size?: number }) => React.JSX.Element;

/**
 * Icon for a catalogue category. Replaces the emoji catalogue with the product's
 * own line-icon set — one shape per category, so the distinction is carried by
 * the glyph rather than by a second colour.
 */
export const CATEGORY_ICON: Record<string, IconC> = {
  fever: IconThermometer,
  cold: IconWind,
  diabetes: IconDroplet,
  heart: IconHeart,
  stomach: IconBowl,
  vitamins: IconSun,
  skin: IconSparkle,
  baby: IconBaby,
  devices: IconWatch,
  personal: IconToothbrush,
  ayush: IconLeaf,
  firstaid: IconBandage,
};

export const categoryIcon = (key: string): IconC => CATEGORY_ICON[key] ?? IconPill;

/** CRM segment → icon. */
export const SEGMENT_ICON: Record<string, IconC> = {
  chronic: IconHeart,
  "high-value": IconStar,
  lapsed: IconAlert,
  new: IconSparkle,
  credit: IconWallet,
  regular: IconUser,
};

export const segmentIcon = (key: string): IconC => SEGMENT_ICON[key] ?? IconUser;

/** Ward supply reason → icon. */
export const SUPPLY_REASON_ICON: Record<string, IconC> = {
  floor: IconBox,
  consumption: IconPill,
  refill: IconRefresh,
};

export const supplyReasonIcon = (key: string): IconC => SUPPLY_REASON_ICON[key] ?? IconBox;

/** Sale source → icon. */
export const SALE_SOURCE_ICON: Record<string, IconC> = {
  opd: IconClipboard,
  counter: IconStore,
  ward: IconBed,
  emergency: IconBolt,
  online: IconGlobe,
};

export const saleSourceIcon = (key: string): IconC => SALE_SOURCE_ICON[key] ?? IconStore;

/** CA report type → icon. */
export const CA_REPORT_ICON: Record<string, IconC> = {
  gst: IconReceipt,
  sales: IconCart,
  purchase: IconTruck,
  pl: IconTrendUp,
  stock: IconBox,
};

export function CaReportIcon({ k, size = 16 }: { k: string; size?: number }) {
  const I = CA_REPORT_ICON[k] ?? IconDoc;
  return <I size={size} />;
}

/**
 * Product tile glyph. A deterministic monogram (first letter of the name) reads
 * as a real catalogue item far better than the same emoji on every medicine.
 */
export { initialsOf, monogramOf } from "./EntityMark.utils";

/* ── ready-to-use renderers, so call sites stay declarative ──────────────── */

export function CategoryIcon({ k, size = 16 }: { k: string; size?: number }) {
  const I = categoryIcon(k);
  return <I size={size} />;
}

export function SegmentIcon({ k, size = 16 }: { k: string; size?: number }) {
  const I = segmentIcon(k);
  return <I size={size} />;
}

export function SupplyReasonIcon({ k, size = 16 }: { k: string; size?: number }) {
  const I = supplyReasonIcon(k);
  return <I size={size} />;
}

export function SaleSourceIcon({ k, size = 16 }: { k: string; size?: number }) {
  const I = saleSourceIcon(k);
  return <I size={size} />;
}

/** Person avatar: uploaded photo, else initials. */
export function Avatar({
  name,
  photo,
  size = 34,
  className = "",
}: {
  name: string;
  photo?: string;
  size?: number;
  className?: string;
}) {
  return (
    <AvatarAtom
      name={name}
      src={photo}
      initials={initialsOf(name)}
      size={avatarSizeFromPixels(size)}
      className={className}
    />
  );
}
