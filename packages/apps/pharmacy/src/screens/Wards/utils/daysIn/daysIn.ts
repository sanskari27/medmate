export const daysIn = (from: number, now: number) =>
  Math.max(1, Math.ceil((now - from) / 86400000));
