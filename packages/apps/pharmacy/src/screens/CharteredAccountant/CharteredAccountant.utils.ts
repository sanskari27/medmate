export function togglePicked(picked: string[], key: string) {
  return picked.includes(key)
    ? picked.filter(function other(item) {
        return item !== key;
      })
    : [...picked, key];
}
