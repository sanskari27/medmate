export function singular(label: string): string {
  if (label.endsWith("ies")) return `${label.slice(0, -3)}y`;
  if (label.endsWith("s")) return label.slice(0, -1);
  return label;
}

export function entryName(label: string): string {
  const name = singular(label);
  return name.charAt(0).toLowerCase() + name.slice(1);
}
