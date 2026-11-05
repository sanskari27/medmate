export function nextPayModes<T>(modes: T[], mode: T) {
  return modes.includes(mode)
    ? modes.filter(function other(item) {
        return item !== mode;
      })
    : [...modes, mode];
}

export function kioskProducts<T extends { online: boolean; category: string }>(
  products: T[],
  category: string,
  units: (product: T) => number,
) {
  return products.filter(function listed(product) {
    return (
      product.online && units(product) > 0 && (category === "all" || product.category === category)
    );
  });
}
