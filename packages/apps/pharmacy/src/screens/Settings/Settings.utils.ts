export function nextBusinessTypes(types: string[], type: string) {
  return types.includes(type) ? types.filter(function other(item) { return item !== type; }) : [...types, type];
}
