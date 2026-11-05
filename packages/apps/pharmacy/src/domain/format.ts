export const inr = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");
export const inr2 = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * 60;

/** "45m", "1h 20m", or "2d 3h". A missing value is an em dash. */
export const fmtMins = (minutes: number | null): string => {
  if (minutes == null) return "—";
  if (minutes < MINUTES_PER_HOUR) return `${minutes}m`;
  if (minutes < MINUTES_PER_DAY) {
    const hours = Math.floor(minutes / MINUTES_PER_HOUR);
    const remainder = minutes % MINUTES_PER_HOUR;
    return `${hours}h${remainder ? " " + remainder + "m" : ""}`;
  }
  const days = Math.floor(minutes / MINUTES_PER_DAY);
  const hours = Math.floor((minutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR);
  return `${days}d ${hours}h`.trim();
};

export const timeAgo = (ts: number, now: number) => {
  const mins = Math.max(0, Math.round((now - ts) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return mins + " min ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + " hr ago";
  return Math.round(hrs / 24) + " d ago";
};

export const fmtDateTime = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

// WhatsApp / SMS compose links (open the messaging app prefilled — user sends)
const phoneDigits = (phone: string) => phone.replace(/[^0-9]/g, "").replace(/^0+/, "");
export const waLink = (phone: string, text: string) => {
  const d = phoneDigits(phone);
  return `https://wa.me/${d.length === 10 ? "91" + d : d}?text=${encodeURIComponent(text)}`;
};
export const smsLink = (phone: string, text: string) => `sms:${phone.replace(/\s/g, "")}?&body=${encodeURIComponent(text)}`;
