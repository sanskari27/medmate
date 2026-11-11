export function isNavActive(path: string, pathname: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function activeNavItem<T extends { path: string }>(
  items: T[],
  pathname: string,
): T | undefined {
  return items
    .filter((item) => isNavActive(item.path, pathname))
    .sort((left, right) => right.path.length - left.path.length)[0];
}
