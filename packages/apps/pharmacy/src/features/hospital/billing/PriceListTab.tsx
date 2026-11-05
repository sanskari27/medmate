import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import { inr, mrpOf } from "@/domain";
import { PriceMode } from "@/features/hospital/hospitalAccount";
import { IconSearch, IconX, IconLock, IconUnlock, IconKey } from "@/components/Icon";
import { monogramOf } from "@/components/entityIcon";

import { useCreditPrice } from "./useCreditPrice";
import { AdminOtpModal } from "./AdminOtpModal";

export function PriceListTab() {
  const {
    inventory,
    hospitalPriceRules,
    hospitalAccount,
    setUniformDiscount,
    setHospitalPriceRule,
    pricingUnlocked,
    lockPricing,
  } = usePharma();
  const cp = useCreditPrice();
  const [q, setQ] = useState("");
  const [otp, setOtp] = useState(false);
  const locked = !pricingUnlocked;
  const list = inventory.filter(
    (p) =>
      !q.trim() ||
      `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(q.toLowerCase()),
  );
  const custom = Object.keys(hospitalPriceRules).length;

  return (
    <>
      {/* lock banner */}
      <div className={`pd-lockbar${locked ? " locked" : ""}`}>
        <span className="ic">{locked ? <IconLock size={16} /> : <IconUnlock size={16} />}</span>
        <div className="gw">
          <b>{locked ? "Pricing is locked" : "Pricing unlocked by admin"}</b>
          <small>
            {locked
              ? "Changing the institutional discount or any product price needs admin OTP approval."
              : "You can change the uniform discount and per-product prices. Lock when done."}
          </small>
        </div>
        {locked ? (
          <button className="pd-btn pd-btn-primary pd-btn-sm" onClick={() => setOtp(true)}>
            <IconKey size={13} /> Unlock with admin OTP
          </button>
        ) : (
          <button className="pd-btn pd-btn-ghost pd-btn-sm" onClick={lockPricing}>
            Lock pricing
          </button>
        )}
      </div>

      {/* uniform discount */}
      <div className="pd-card pd-card-pad" style={{ marginTop: 14 }}>
        <div className="pd-flex" style={{ gap: 14, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 14 }}>
              Uniform institutional discount
            </div>
            <div className="pd-muted" style={{ fontSize: 12.5 }}>
              Applies to every product without its own rule · {custom} product
              {custom !== 1 ? "s" : ""} customised
            </div>
          </div>
          <div className="pd-spacer" />
          <div className="pd-flex pd-gap6">
            <input
              className="pd-input"
              type="number"
              min={0}
              max={95}
              disabled={locked}
              value={hospitalAccount.discountPct}
              onChange={(e) => setUniformDiscount(Number(e.target.value) || 0)}
              style={{ width: 90, textAlign: "right", opacity: locked ? 0.55 : 1 }}
            />
            <span style={{ fontWeight: 800, alignSelf: "center" }}>% off MRP</span>
          </div>
        </div>
      </div>

      <div className="pd-toolbar" style={{ margin: "14px 0" }}>
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input placeholder="Search medicine…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="pd-spacer" />
        <span className="pd-muted" style={{ fontSize: 13 }}>
          Per-product: set a % or flat ₹ discount off MRP. Credit price = what the hospital is
          billed.
        </span>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Medicine</th>
                <th className="num">MRP</th>
                <th>Discount type</th>
                <th className="num">Value</th>
                <th className="num">Credit price</th>
                <th className="num">Eff. disc</th>
                <th>Pricing</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => {
                const mrp = mrpOf(p);
                const price = cp(p.id);
                const rule = hospitalPriceRules[p.id];
                const mode: PriceMode = rule?.mode ?? "percent";
                const off = mrp > 0 ? Math.round((1 - price / mrp) * 100) : 0;
                const setMode = (m: PriceMode) =>
                  setHospitalPriceRule(p.id, {
                    mode: m,
                    value: rule?.value ?? (m === "percent" ? hospitalAccount.discountPct : 0),
                  });
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="prod">
                        <span className="em">{monogramOf(p.name)}</span>
                        <span className="nm">{p.name}</span>
                      </div>
                    </td>
                    <td className="num">{inr(mrp)}</td>
                    <td>
                      <div
                        className="pd-seg"
                        style={{ display: "inline-flex", opacity: locked ? 0.55 : 1 }}
                      >
                        <button
                          className={mode === "percent" ? "on" : ""}
                          disabled={locked}
                          style={{ padding: "4px 10px" }}
                          onClick={() => setMode("percent")}
                        >
                          %
                        </button>
                        <button
                          className={mode === "flat" ? "on" : ""}
                          disabled={locked}
                          style={{ padding: "4px 10px" }}
                          onClick={() => setMode("flat")}
                        >
                          ₹
                        </button>
                      </div>
                    </td>
                    <td className="num">
                      <input
                        className="pd-input pd-mono"
                        disabled={locked}
                        type="number"
                        min={0}
                        value={rule ? rule.value : ""}
                        placeholder={mode === "percent" ? String(hospitalAccount.discountPct) : "—"}
                        onChange={(e) =>
                          setHospitalPriceRule(
                            p.id,
                            e.target.value === "" ? null : { mode, value: Number(e.target.value) },
                          )
                        }
                        style={{
                          width: 74,
                          textAlign: "right",
                          padding: "5px 8px",
                          opacity: locked ? 0.55 : 1,
                        }}
                      />
                    </td>
                    <td className="num" style={{ fontWeight: 800 }}>
                      {inr(price)}
                    </td>
                    <td className="num">{off}%</td>
                    <td>
                      {rule ? (
                        <span className="pd-flex pd-gap6">
                          <span className="pd-pill pill-gold">
                            Custom {rule.mode === "percent" ? rule.value + "%" : "₹" + rule.value}
                          </span>
                          <button
                            className="pd-iconbtn"
                            disabled={locked}
                            title="Reset to uniform"
                            onClick={() => setHospitalPriceRule(p.id, null)}
                          >
                            <IconX size={13} />
                          </button>
                        </span>
                      ) : (
                        <span className="pd-pill pill-gray">
                          Uniform −{hospitalAccount.discountPct}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {otp && <AdminOtpModal onClose={() => setOtp(false)} />}
    </>
  );
}
