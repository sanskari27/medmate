export type OfferType = "pct" | "flat";
export type OfferScope = "all" | "product";

export type Offer = {
  id: string;
  title: string;
  code: string;
  type: OfferType;
  value: number;
  scope: OfferScope;
  target: string | null;
  active: boolean;
  itemCount: number;
};

export type OfferProduct = {
  productId: string;
  name: string;
};

export type OfferDraft = {
  title: string;
  code: string;
  type: OfferType;
  value: string;
  scope: OfferScope;
  target: string;
};

export type OfferAccess = {
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type OfferPayload = {
  title: string;
  code: string;
  type: OfferType;
  value: number;
  scope: OfferScope;
  target: string | null;
};

export function canOpenOffers(role: string | null | undefined, permissions: string[] | undefined) {
  return role === "owner" || (permissions ?? []).includes("offers:read");
}

export function offerAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
): OfferAccess {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("offers:create"),
    update: owner || keys.includes("offers:update"),
    delete: owner || keys.includes("offers:delete"),
  };
}

export function blankDraft(): OfferDraft {
  return {
    title: "",
    code: "",
    type: "pct",
    value: "10",
    scope: "all",
    target: "",
  };
}

export function draftFromOffer(offer: Offer): OfferDraft {
  return {
    title: offer.title,
    code: offer.code,
    type: offer.type,
    value: String(offer.value),
    scope: offer.scope,
    target: offer.target ?? "",
  };
}

export function draftIsValid(draft: OfferDraft): boolean {
  if (!draft.title.trim() || !draft.code.trim()) return false;
  if (!money(draft.value)) return false;
  return draft.scope === "all" || draft.target.trim().length > 0;
}

export function payload(draft: OfferDraft): OfferPayload {
  return {
    title: draft.title.trim(),
    code: draft.code.trim().toUpperCase(),
    type: draft.type,
    value: Number(draft.value),
    scope: draft.scope,
    target: draft.scope === "product" ? draft.target : null,
  };
}

export function discountLabel(type: OfferType, value: number): string {
  const shown = Number.isInteger(value) ? String(value) : String(value);
  return type === "pct" ? `${shown}% OFF` : `₹${shown} OFF`;
}

export function appliesLabel(scope: OfferScope): string {
  return scope === "all" ? "all products" : "1 product";
}

function money(raw: string): boolean {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return false;
  return /^\d+(\.\d{1,2})?$/.test(raw.trim());
}
