export function matchingFaqs<T extends { q: string; a: string }>(faqs: T[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return faqs;
  return faqs.filter(function match(item) {
    return item.q.toLowerCase().includes(needle) || item.a.toLowerCase().includes(needle);
  });
}
