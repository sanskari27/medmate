export const dOnly = (ts: number) =>
  new Date(ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
