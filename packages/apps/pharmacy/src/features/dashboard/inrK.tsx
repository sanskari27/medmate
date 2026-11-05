export const inrK = (n: number) =>
  n >= 1e7
    ? `₹${(n / 1e7).toFixed(1)}Cr`
    : n >= 1e5
      ? `₹${(n / 1e5).toFixed(1)}L`
      : n >= 1000
        ? `₹${Math.round(n / 1000)}k`
        : `₹${Math.round(n)}`;
