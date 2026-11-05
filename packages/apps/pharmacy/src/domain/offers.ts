import { mrpOf, type InvProduct } from "@/domain/stock";

// ── offers / promotions ─────────────────────────────────────────
export type OfferType = "pct" | "flat";
export type OfferScope = "all" | "category" | "product";
export type Offer = {
  id: string;
  title: string;
  code: string;
  type: OfferType;
  value: number; // % or ₹
  scope: OfferScope;
  target?: string; // category key or product id
  online: boolean; // show on customer app
  active: boolean;
};

// the per-product "direct offer" created from the online-store page (id = "od-<productId>")
export const directOfferId = (productId: string) => "od-" + productId;
export const directOfferOf = (p: InvProduct, offers: Offer[]): Offer | undefined =>
  offers.find((o) => o.id === directOfferId(p.id));
/** Selling price after the offer saved on this product. A percent offer rounds to the rupee. */
export const onlineOfferPrice = (product: InvProduct, offers: Offer[]): number => {
  const priceBeforeOffer = product.onlinePrice ?? mrpOf(product);
  const offer = offers.find((row) => row.id === product.offerId && row.active && row.online);
  if (!offer) return priceBeforeOffer;
  if (offer.type === "pct") return Math.round(priceBeforeOffer * (1 - offer.value / 100));
  return Math.max(0, priceBeforeOffer - offer.value);
};
