import { useMemo, useState } from "react";
import { usePharma } from "@/store/slices/session";
import { SupplyEntry, inr2, effectiveSupplyPrice, schemeLabel, isDevice } from "@/utils";
import { IconStar, IconScale, IconCash, IconTag, IconCheck } from "@/components/Icon";
import { Thumb } from "@/components/bits";

import { multiSourceCount } from "@/screens/Purchases/components/multiSourceCount";

export function PriceCompare() {
  const { supplyList, suppliers, inventory } = usePharma();
  const [q, setQ] = useState("");
  const [onlyMulti, setOnlyMulti] = useState(true);

  const prodOf = (id: string) => inventory.find((p) => p.id === id);
  const supOf = (id: string) => suppliers.find((s) => s.id === id);

  // group supply rows by product
  const groups = useMemo(() => {
    const m: Record<string, SupplyEntry[]> = {};
    supplyList.forEach((e) => {
      (m[e.productId] ||= []).push(e);
    });
    return Object.entries(m)
      .map(([pid, rows]) => ({
        p: prodOf(pid),
        rows: rows.slice().sort((a, b) => effectiveSupplyPrice(a) - effectiveSupplyPrice(b)),
      }))
      .filter((g) => g.p)
      .filter((g) => !onlyMulti || g.rows.length > 1)
      .filter(
        (g) =>
          !q.trim() ||
          g.p!.name.toLowerCase().includes(q.toLowerCase()) ||
          g.p!.composition.toLowerCase().includes(q.toLowerCase()),
      )
      .sort((a, b) => a.p!.name.localeCompare(b.p!.name));
  }, [supplyList, inventory, onlyMulti, q]);

  const totalSaving = groups.reduce((sum, g) => {
    if (g.rows.length < 2) return sum;
    return (
      sum + (effectiveSupplyPrice(g.rows[g.rows.length - 1]) - effectiveSupplyPrice(g.rows[0]))
    );
  }, 0);

  return (
    <>
      <div className="pd-stats">
        <div className="pd-stat">
          <div className="ic ic-blue">
            <IconScale size={18} />
          </div>
          <div className="lbl">Comparable items</div>
          <div className="val">{multiSourceCount(supplyList)}</div>
          <div className="split">supplied by 2+ distributors</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-green">
            <IconCash size={18} />
          </div>
          <div className="lbl">Saving per pack</div>
          <div className="val">{inr2(totalSaving)}</div>
          <div className="split">buying each at its lowest</div>
        </div>
        <div className="pd-stat">
          <div className="ic ic-gold">
            <IconTag size={18} />
          </div>
          <div className="lbl">Distributors compared</div>
          <div className="val">{suppliers.length}</div>
          <div className="split">across your supply list</div>
        </div>
      </div>

      <div className="pd-toolbar">
        <h2 style={{ fontSize: 16 }}>Purchase-price comparison</h2>
        <div className="pd-spacer" />
        <label
          className="pd-flex"
          style={{ gap: 8, alignItems: "center", fontSize: 12.5, fontWeight: 600 }}
        >
          <button
            type="button"
            className={`pd-switch${onlyMulti ? " on" : ""}`}
            onClick={() => setOnlyMulti((v) => !v)}
            aria-label="Toggle"
          />
          Only multi-source
        </label>
        <input
          className="pd-input"
          placeholder="Search medicine…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 220 }}
        />
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Medicine / device</th>
                <th>Quotes from distributors (low → high)</th>
                <th className="num">Best ₹</th>
                <th className="num">Saving / pack</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => {
                const p = g.p!;
                const low = g.rows[0];
                const high = g.rows[g.rows.length - 1];
                const saving =
                  g.rows.length > 1 ? effectiveSupplyPrice(high) - effectiveSupplyPrice(low) : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="prod">
                        <span className="em">
                          <Thumb p={p} />
                        </span>
                        <span>
                          <span className="nm">{p.name}</span>
                          <div className="sub">
                            {isDevice(p) ? "Device · " : ""}
                            {p.pack}
                          </div>
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="pd-flex" style={{ flexWrap: "wrap", gap: 6 }}>
                        {g.rows.map((r, i) => (
                          <span
                            key={r.id}
                            className={`pd-pill ${i === 0 ? "pill-green" : "pill-gray"}`}
                            title={
                              schemeLabel(r)
                                ? `${inr2(r.purchasePrice)} list, ${schemeLabel(r)} scheme`
                                : i === 0
                                  ? "Lowest landed price"
                                  : undefined
                            }
                            style={{ gap: 5 }}
                          >
                            {r.preferred && (
                              <>
                                <IconStar size={12} />{" "}
                              </>
                            )}
                            {supOf(r.supplierId)?.name ?? "—"} · {inr2(effectiveSupplyPrice(r))}
                            {schemeLabel(r) ? ` (${schemeLabel(r)})` : ""}
                            {i === 0 && g.rows.length > 1 ? (
                              <>
                                {" "}
                                <IconCheck size={12} />
                              </>
                            ) : (
                              ""
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="num" style={{ fontWeight: 700, color: "#1f7a46" }}>
                      {inr2(effectiveSupplyPrice(low))}
                    </td>
                    <td
                      className="num"
                      style={{ fontWeight: 700, color: saving > 0 ? "#1f7a46" : "var(--mid)" }}
                    >
                      {saving > 0 ? inr2(saving) : "—"}
                    </td>
                  </tr>
                );
              })}
              {groups.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="pd-empty" style={{ padding: 28 }}>
                      <div className="em">
                        <IconScale size={30} />
                      </div>
                      <p>
                        {onlyMulti
                          ? "No medicine is sourced from 2+ distributors yet. Add the same item under different distributors in the Supply list to compare prices."
                          : "No supply items to compare."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
