import { useState } from "react";
import { inr, fmtDateTime } from "@/utils";
import {
  Patient,
  Segment,
  SEGMENTS,
  segLabel,
  attributedSales,
  Campaign,
} from "@/utils/calculations/crm";
import { IconWhatsApp, IconDot, IconMail } from "@/components/Icon";

import { wa } from "@/screens/Crm/components/wa";
import { sms } from "@/screens/Crm/components/sms";

export function Campaigns(s: any) {
  const { patients, profile, crm, addCampaign, sales } = s;
  const [seg, setSeg] = useState<Segment | "all">("chronic");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");
  const recipients = patients.filter(
    (p: Patient) => (seg === "all" || p.segments.includes(seg)) && p.phone,
  );
  const defaultMsg =
    `Hi! This is ${profile.name}. ` +
    (offer ? `${offer}. ` : "") +
    `Visit us or reply to order your medicines. Stay healthy!`;
  const text = message || defaultMsg;
  const launch = async () => {
    if (recipients.length === 0) return;
    const err = await addCampaign({
      name: `${segLabel(seg as Segment) || "All"} blast`,
      segment: seg,
      channel,
      message: text,
      offerLabel: offer || undefined,
      reach: recipients.length,
    });
    if (!err && recipients[0].phone)
      (channel === "whatsapp" ? wa : sms)(
        recipients[0].phone,
        text.replace("Hi!", `Hi ${recipients[0].name}!`),
      );
  };
  return (
    <div className="pd-grid-2">
      <div className="pd-card">
        <div className="pd-card-head">
          <h3>New campaign</h3>
          <span className="sub">{recipients.length} recipients</span>
        </div>
        <div className="pd-card-pad" style={{ display: "grid", gap: 12 }}>
          <div className="pd-field">
            <label>Target segment</label>
            <select
              className="pd-select"
              value={seg}
              onChange={(e) => setSeg(e.target.value as any)}
            >
              <option value="all">Everyone with phone</option>
              {SEGMENTS.map((x) => (
                <option key={x.key} value={x.key}>
                  {x.label}
                </option>
              ))}
            </select>
          </div>
          <div className="pd-field">
            <label>Channel</label>
            <div className="pd-seg">
              <button
                className={channel === "whatsapp" ? "on" : ""}
                onClick={() => setChannel("whatsapp")}
              >
                WhatsApp
              </button>
              <button className={channel === "sms" ? "on" : ""} onClick={() => setChannel("sms")}>
                SMS
              </button>
            </div>
          </div>
          <div className="pd-field">
            <label>Offer (optional)</label>
            <input
              className="pd-input"
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              placeholder="e.g. 10% off all diabetes meds"
            />
          </div>
          <div className="pd-field">
            <label>Message</label>
            <textarea
              className="pd-input"
              rows={4}
              value={text}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button
            className="pd-btn pd-btn-primary pd-btn-block"
            disabled={recipients.length === 0}
            onClick={launch}
          >
            <IconWhatsApp size={16} /> Send to {recipients.length}{" "}
            {channel === "whatsapp" ? "on WhatsApp" : "via SMS"}
          </button>
          <p className="pd-muted" style={{ fontSize: 11.5 }}>
            ⓘ Opens the first recipient prefilled for you to send, and logs the campaign reach. Bulk
            send needs a WhatsApp Business API (can be wired later).
          </p>
        </div>
      </div>
      <div className="pd-card">
        <div className="pd-card-head">
          <h3>Campaign history</h3>
          <span className="sub">{crm.campaigns.length} sent</span>
        </div>
        <div className="pd-card-pad">
          {crm.campaigns.length === 0 && (
            <div className="pd-empty" style={{ padding: 16 }}>
              <p>No campaigns yet.</p>
            </div>
          )}
          {crm.campaigns.map((c: Campaign) => {
            const rev = attributedSales(c, patients, sales);
            return (
              <div className="pd-row" key={c.id}>
                <span className="em">
                  {c.channel === "whatsapp" ? (
                    <span style={{ color: "var(--green)" }}>
                      <IconDot size={8} />
                    </span>
                  ) : (
                    <IconMail size={15} />
                  )}
                </span>
                <span className="gw">
                  <div className="t">
                    {c.name} · {c.reach} sent
                  </div>
                  <div className="s">
                    {segLabel(c.segment as Segment) || "All"}
                    {c.offerLabel ? " · " + c.offerLabel : ""} · {fmtDateTime(c.sentAt)}
                  </div>
                </span>
                <span style={{ textAlign: "right", fontSize: 12 }}>
                  <b style={{ color: "var(--green)" }}>{inr(rev)}</b>
                  <br />
                  <span className="pd-muted" style={{ fontSize: 11 }}>
                    attributed
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
