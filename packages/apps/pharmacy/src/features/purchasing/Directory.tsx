import { useMemo, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  Supplier, SupplyEntry, InvProduct, inr, inr2, allottedSupplierId,
  bestSupplyFor, effectiveSupplyPrice, schemeLabel, isDevice, mrpOf, catLabel, isValidGstin,
} from "@/domain";
import { IconPlus, IconX, IconTrash, IconEdit, IconTruck, IconMail, IconBox, IconCard, IconUsers, IconPhone, IconReceipt, IconRefresh, IconStar, IconScale, IconCash, IconTag, IconCheck } from "@/components/Icon";
import { Thumb } from "@/components/bits";

import { DistributorModal } from "./DistributorModal";

type Tab = "directory" | "supply" | "compare";

const BLANK_SUP: Omit<Supplier, "id"> = {
  name: "", gstin: "", phone: "", contactPerson: "", email: "", address: "",
  city: "", state: "Karnataka", dlNo: "", paymentTerms: "30 days credit", outstanding: 0, active: true,
};

export function Directory() {
  const { suppliers, inventory, addSupplier, updateSupplier, removeSupplier } = usePharma();
  const [edit, setEdit] = useState<Supplier | null>(null);
  const [adding, setAdding] = useState(false);
  const [q, setQ] = useState("");

  const prodCount = useMemo(() => {
    const m: Record<string, number> = {};
    inventory.forEach((p) => { const id = allottedSupplierId(p, suppliers); m[id] = (m[id] || 0) + 1; });
    return m;
  }, [inventory, suppliers]);

  const totalOutstanding = suppliers.reduce((s, x) => s + (x.outstanding || 0), 0);
  const activeCount = suppliers.filter((s) => s.active !== false).length;

  const filtered = suppliers.filter((s) => {
    if (!q.trim()) return true;
    const t = q.toLowerCase();
    return [s.name, s.gstin, s.phone, s.contactPerson, s.city, s.email].filter(Boolean).some((v) => v!.toLowerCase().includes(t));
  });

  return (
    <>
      <div className="pd-stats" >
        <div className="pd-stat"><div className="ic ic-blue"><IconTruck size={18} /></div><div className="lbl">Distributors</div><div className="val">{suppliers.length}</div><div className="split">{activeCount} active</div></div>
        <div className="pd-stat"><div className="ic ic-green"><IconBox size={18} /></div><div className="lbl">Products sourced</div><div className="val">{inventory.length}</div><div className="split">across all suppliers</div></div>
        <div className="pd-stat"><div className="ic ic-rose"><IconCard size={18} /></div><div className="lbl">Total outstanding</div><div className="val">{inr(totalOutstanding)}</div><div className="split">payable to distributors</div></div>
        <div className="pd-stat"><div className="ic ic-gold"><IconUsers size={18} /></div><div className="lbl">On credit terms</div><div className="val">{suppliers.filter((s) => (s.paymentTerms || "").toLowerCase().includes("credit")).length}</div><div className="split">credit accounts</div></div>
      </div>

      <div className="pd-toolbar">
        <h2 style={{ fontSize: 16 }}>Distributor directory</h2>
        <div className="pd-spacer" />
        <input className="pd-input" placeholder="Search name, GSTIN, contact…" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 260 }} />
        <button className="pd-btn pd-btn-primary" onClick={() => setAdding(true)}><IconPlus size={16} /> Add distributor</button>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead><tr><th>Distributor</th><th>Contact</th><th>GSTIN / DL No.</th><th>Payment terms</th><th className="num">Products</th><th className="num">Outstanding</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="prod">
                      <span className="em" style={{ background: "var(--wash)", color: "var(--mid)", display: "grid", placeItems: "center" }}><IconTruck size={18} /></span>
                      <span><span className="nm">{s.name}</span><div className="sub">{[s.city, s.state].filter(Boolean).join(", ") || "—"}</div></span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.contactPerson || "—"}</div>
                    <div className="sub pd-muted" style={{ fontSize: 11.5 }}><IconPhone size={12} /> {s.phone}</div>
                    {s.email && <div className="sub pd-muted" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5 }}><IconMail size={12} /> {s.email}</div>}
                  </td>
                  <td className="pd-mono" style={{ fontSize: 12 }}>{s.gstin || "—"}<div className="pd-muted">{s.dlNo || "—"}</div></td>
                  <td>{s.paymentTerms || "—"}</td>
                  <td className="num"><span className="pd-pill pill-blue">{prodCount[s.id] || 0}</span></td>
                  <td className="num" style={{ fontWeight: 700, color: (s.outstanding || 0) > 0 ? "#b4232a" : "var(--mid)" }}>{inr(s.outstanding || 0)}</td>
                  <td><span className={`pd-pill ${s.active !== false ? "pill-green" : "pill-gray"}`}><i className="d" />{s.active !== false ? "Active" : "Inactive"}</span></td>
                  <td className="num">
                    <div className="pd-flex pd-gap6" style={{ justifyContent: "flex-end" }}>
                      <button className="pd-iconbtn" title="Edit" onClick={() => setEdit(s)}><IconEdit size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={8}><div className="pd-empty" style={{ padding: 28 }}><div className="em"><IconTruck size={30} /></div><p>{q ? "No distributors match your search." : "No distributors added yet."}</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {(adding || edit) && (
        <DistributorModal
          init={edit ?? undefined}
          onClose={() => { setAdding(false); setEdit(null); }}
          onSave={async (data) => {
            const err = edit ? await updateSupplier(edit.id, data) : await addSupplier(data);
            if (!err) { setAdding(false); setEdit(null); }
          }}
        />
      )}
    </>
  );
}
