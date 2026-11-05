export function productsInOffer<T extends { category: string; id: string }>(
  products: T[],
  offer: { scope: string; target?: string },
) {
  return products.filter(function match(product) {
    if (offer.scope === "all") return true;
    if (offer.scope === "category") return product.category === offer.target;
    return product.id === offer.target;
  }).length;
}
