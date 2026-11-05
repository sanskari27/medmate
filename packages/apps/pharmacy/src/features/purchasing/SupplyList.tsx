import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  Supplier, SupplyEntry, InvProduct, inr, inr2, allottedSupplierId,
  bestSupplyFor, effectiveSupplyPrice, schemeLabel, isDevice, mrpOf, catLabel, isValidGstin,
} from "@/domain";
import { IconPlus, IconX, IconTrash, IconEdit, IconTruck, IconMail, IconBox, IconCard, IconUsers, IconPhone, IconReceipt, IconRefresh, IconStar, IconScale, IconCash, IconTag, IconCheck } from "@/components/Icon";
import { Thumb } from "@/components/bits";

import { multiSourceCount } from "./multiSourceCount";
import { SupplyModal } from "./SupplyModal";

type Tab = "directory" | "supply" | "compare";

const BLANK_SUP: Omit<Supplier, "id"> = {
  name: "", gstin: "", phone: "", contactPerson: "", email: "", address: "",
  city: "", state: "Karnataka", dlNo: "", paymentTerms: "30 days credit", outstanding: 0, active: true,
};

export function SupplyList() {
  const { supplyList, suppliers, inventory, addSupply, updateSupply, removeSupply, setPreferredSupply } = usePharma();
  const [edit, setEdit] = useState<SupplyEntry | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");
  const [supFilter, setSupFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "medicine" | "device">("all");

  const prodOf = (id: string) => inventory.find((p) => p.id === id);
  const supOf = (id: string) => suppliers.find((s) => s.id === id);

  const rows = supplyList.filter((e) => {
    const p = prodOf(e.productId);
    if (!p) return false;
    if (supFilter !== "all" && e.supplierId !== supFilter) return false;
    if (typeFilter === "device" && !isDevice(p)) return false;
    if (typeFilter === "medicine" && isDevice(p)) return false;
    if (q.trim()) {
      const t = q.toLowerCase();
      if (![p.name, p.composition, p.manufacturer, supOf(e.supplierId)?.name].filter(Boolean).some((v) => v!.toLowerCase().includes(t))) return false;
    }
    return true;
  }).sort((a, b) => (prodOf(a.productId)!.name).localeCompare(prodOf(b.productId)!.name));

  const deviceCount = supplyList.filter((e) => { const p = prodOf(e.productId); return p && isDevice(p); }).length;

  return (
    <>
      <div className="pd-stats" >
        <div className="pd-stat"><div className="ic ic-blue"><IconReceipt size={18} /></div><div className="lbl">Supply items</div><div className="val">{supplyList.length}</div><div className="split">{supplyList.length - deviceCount} medicines · {deviceCount} devices</div></div>
        <div className="pd-stat"><div className="ic ic-green"><IconRefresh size={18} /></div><div className="lbl">Multi-source items</div><div className="val">{multiSourceCount(supplyList)}</div><div className="split">supplied by 2+ distributors</div></div>
        <div className="pd-stat"><div className="ic ic-gold"><IconStar size={18} /></div><div className="lbl">Preferred set</div><div className="val">{supplyList.filter((e) => e.preferred).length}</div><div className="split">marked best source</div></div>
      </div>

      <div className="pd-toolbar">
        <h2 style={{ fontSize: 16 }}>Medicines & devices by distributor</h2>
        <div className="pd-spacer" />
        <select className="pd-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)} style={{ maxWidth: 140 }}>
          <option value="all">All types</option><option value="medicine">Medicines</option><option value="device">Devices</option>
        </select>
        <select className="pd-select" value={supFilter} onChange={(e) => setSupFilter(e.target.value)} style={{ maxWidth: 200 }}>
          <option value="all">All distributors</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="pd-input" placeholder="Search medicine / device…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 220 }} />
        <button className="pd-btn pd-btn-primary" onClick={() => setAdding(true)}><IconPlus size={16} /> Add supply item</button>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead><tr><th>Medicine / device</th><th>Type</th><th>Distributor</th><th className="num">Purchase ₹</th><th className="num">MRP ₹</th><th className="num">Margin</th><th className="num">Price rank</th><th></th></tr></thead>
            <tbody>
              {rows.map((e) => {
                const p = prodOf(e.productId)!;
                const sup = supOf(e.supplierId);
                const best = bestSupplyFor(e.productId, supplyList);
                const isCheapest = best?.id === e.id;
                const sources = supplyList.filter((x) => x.productId === e.productId).length;
                const mrp = e.mrp ?? mrpOf(p);
                const eff = effectiveSupplyPrice(e);
                const bestEff = best ? effectiveSupplyPrice(best) : eff;
                const margin = mrp > 0 ? ((mrp - eff) / mrp) * 100 : 0;
                return (
                  <tr key={e.id}>
                    <td><div className="prod"><span className="em"><Thumb p={p} /></span><span><span className="nm">{p.name} {e.preferred && <span title="Preferred source"><IconStar size={13} /></span>}</span><div className="sub">{p.composition} · {p.pack}</div></span></div></td>
                    <td><span className={`pd-pill ${isDevice(p) ? "pill-teal" : "pill-gray"}`}>{isDevice(p) ? "Device" : "Medicine"}</span><div className="sub pd-muted" style={{ fontSize: 11 }}>{catLabel(p.category)}</div></td>
                    <td style={{ fontWeight: 600 }}>{sup?.name ?? "—"}{e.note && <div className="sub pd-muted" style={{ fontSize: 11 }}>{e.note}</div>}</td>
                    <td className="num" style={{ fontWeight: 700 }}>{inr2(e.purchasePrice)}{schemeLabel(e) && <div className="sub" style={{ fontSize: 11, color: "#1f7a46", fontWeight: 700 }}>{schemeLabel(e)} → {inr2(eff)}</div>}</td>
                    <td className="num pd-muted">{inr2(mrp)}</td>
                    <td className="num"><span className={`pd-pill ${margin >= 30 ? "pill-green" : margin >= 15 ? "pill-gold" : "pill-rose"}`}>{margin.toFixed(0)}%</span></td>
                    <td className="num">{sources > 1 ? (isCheapest ? <span className="pd-pill pill-green"><i className="d" />Lowest</span> : <span className="pd-muted" style={{ fontSize: 11.5 }}>+{inr2(eff - bestEff)}</span>) : <span className="pd-muted" style={{ fontSize: 11.5 }}>only source</span>}</td>
                    <td className="num">
                      <div className="pd-flex pd-gap6" style={{ justifyContent: "flex-end" }}>
                        {!e.preferred && <button className="pd-btn pd-btn-ghost pd-btn-sm" title="Mark preferred source" onClick={() => setPreferredSupply(e.id)}><IconStar size={14} /></button>}
                        <button className="pd-iconbtn" title="Edit" onClick={() => setEdit(e)}><IconEdit size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan={8}><div className="pd-empty" style={{ padding: 28 }}><div className="em"><IconReceipt size={30} /></div><p>No supply items match. Add what you purchase from each distributor.</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || edit) && (
        <SupplyModal
          init={edit ?? undefined}
          onClose={() => { setAdding(false); setEdit(null); }}
          onSave={async (data) => {
            const err = edit ? await updateSupply(edit.id, data) : await addSupply(data);
            if (!err) { setAdding(false); setEdit(null); }
          }}
        />
      )}
    </>
  );
}
