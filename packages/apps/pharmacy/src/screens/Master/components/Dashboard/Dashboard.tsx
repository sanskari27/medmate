type Desk =
  | "dashboard"
  | "pharmacies"
  | "kyc"
  | "subscriptions"
  | "coupons"
  | "requests"
  | "support"
  | "consultations"
  | "referrals"
  | "activity";

export function Dashboard({
  counts,
  onOpen,
}: {
  counts: Record<string, number>;
  onOpen: (desk: Desk) => void;
}) {
  const cards: { key: Desk; label: string; hint: string; accent: string }[] = [
    { key: "pharmacies", label: "Pharmacies", hint: "On this server", accent: "accent-green" },
    {
      key: "kyc",
      label: "KYC incomplete",
      hint: "GSTIN, PAN, or drug licence",
      accent: "accent-gold",
    },
    {
      key: "subscriptions",
      label: "Subscriptions due",
      hint: "Expired or renewing in 30 days",
      accent: "accent-rose",
    },
    {
      key: "requests",
      label: "Plan requests",
      hint: "Waiting to be handled",
      accent: "accent-blue",
    },
    { key: "support", label: "Open tickets", hint: "Support inbox", accent: "accent-green" },
  ];
  return (
    <div className="pd-stats">
      {cards.map((card) => (
        <div
          key={card.key}
          className={`pd-stat link kpi ${card.accent}`}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(card.key)}
          onKeyDown={(event) => {
            if (event.key === "Enter") onOpen(card.key);
          }}
        >
          <div className="lbl">{card.label}</div>
          <div className="val">
            {
              counts[
                card.key === "pharmacies"
                  ? "pharmacies"
                  : card.key === "kyc"
                    ? "kyc"
                    : card.key === "subscriptions"
                      ? "due"
                      : card.key === "requests"
                        ? "requests"
                        : "tickets"
              ]
            }
          </div>
          <div className="split">{card.hint}</div>
        </div>
      ))}
    </div>
  );
}
