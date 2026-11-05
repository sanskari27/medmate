export function monogramOf(name: string): string {
  const character = (name || "").trim().charAt(0);
  return character ? character.toUpperCase() : "•";
}

export function initialsOf(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1] ?? "";
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}

export function avatarSizeFromPixels(size: number): "sm" | "md" | "lg" {
  if (size <= 30) return "sm";
  if (size <= 44) return "md";
  return "lg";
}
