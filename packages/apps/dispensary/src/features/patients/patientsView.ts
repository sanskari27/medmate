import type { PatientRow } from "./model";

export function rupee(amount: string | null | undefined) {
  if (!amount) return "—";
  return `₹${amount}`;
}

export function visitDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function segmentLabel(segment: string) {
  switch (segment) {
    case "high-value":
      return "High value";
    case "lapsed":
      return "Lapsed / at-risk";
    case "new":
      return "New";
    case "credit":
      return "On credit";
    case "regular":
      return "Regular";
    case "chronic":
      return "Chronic care";
    default:
      return segment;
  }
}

export function collectHref(phone: string, name: string, outstanding: string) {
  const text = `Hi ${name}, your pending medicine credit (khata) balance is ₹${outstanding}. Kindly clear it at your convenience.`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

export function messageHref(channel: "whatsapp" | "sms", phone: string, text: string) {
  if (channel === "sms") return `sms:${phone}?body=${encodeURIComponent(text)}`;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(text)}`;
}

export function exportCsv(rows: PatientRow[]) {
  const lines = [
    ["Name", "Phone", "Orders", "Units", "Lifetime", "Points"].join(","),
    ...rows.map((row) =>
      [row.name, row.phone, row.orders, row.units, row.spent, row.points].join(","),
    ),
  ];
  return lines.join("\n");
}

export function exportText(rows: PatientRow[]) {
  return rows
    .map((row) => `${row.name} ${row.phone} ${row.orders} ${row.units} ${row.spent} ${row.points}`)
    .join("\n");
}

export function download(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
