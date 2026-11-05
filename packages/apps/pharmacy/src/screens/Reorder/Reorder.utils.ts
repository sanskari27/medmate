export function lowStockProducts<T>(products: T[], low: (product: T) => boolean) {
  return products.filter(function match(product) {
    return low(product);
  });
}
