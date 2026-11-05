export function catalogProducts<T extends { category: string; name: string }>(products: T[], category: string, query: string) {
  const needle = query.toLowerCase();
  return products.filter(function listed(product) {
    if (category !== "all" && product.category !== category) return false;
    if (needle && !product.name.toLowerCase().includes(needle)) return false;
    return true;
  });
}
