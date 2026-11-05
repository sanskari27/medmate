export function unassignedProducts<T>(products: T[], placed: (product: T) => boolean) {
  return products.filter(function loose(product) {
    return !placed(product);
  });
}
