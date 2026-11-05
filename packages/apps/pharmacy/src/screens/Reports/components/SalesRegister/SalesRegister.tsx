import { useState } from "react";
import { inr, PAY_LABEL, PayMode, Channel, OrderStatus, STATUS_LABEL, fmtDateTime } from "@/utils";
import { IconSearch } from "@/components/Icon";
type SSort = "date" | "total" | "items" | "customer";

export function SalesRegister({ enriched }: { enriched: any[]; now: number }) {
  const [q, setQ] = useState("");
  const [chan, setChan] = useState<"all" | Channel>("all");
  const [pay, setPay] = useState<"all" | PayMode>("all");
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [rxOnly, setRxOnly] = useState(false);
  const [sort, setSort] = useState<SSort>("date");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const toggle = (k: SSort) => {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setDir("desc");
    }
  };

  let rows = enriched.filter(({ s }) => {
    if (chan !== "all" && s.channel !== chan) return false;
    if (pay !== "all" && s.payMode !== pay) return false;
    if (status !== "all" && s.status !== status) return false;
    if (rxOnly && !s.rx) return false;
    if (
      q &&
      !`${s.id} ${s.customer.name} ${s.customer.phone ?? ""}`
        .toLowerCase()
        .includes(q.toLowerCase())
    )
      return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    const m = dir === "asc" ? 1 : -1;
    if (sort === "total") return (a.t.payable - b.t.payable) * m;
    if (sort === "items")
      return (
        (a.s.items.reduce((x: number, i: any) => x + i.qty, 0) -
          b.s.items.reduce((x: number, i: any) => x + i.qty, 0)) *
        m
      );
    if (sort === "customer") return a.s.customer.name.localeCompare(b.s.customer.name) * m;
    return (a.s.createdAt - b.s.createdAt) * m;
  });

  const tGross = rows.reduce((a, r) => a + r.t.gross, 0);
  const tDisc = rows.reduce((a, r) => a + r.t.discount, 0);
  const tTax = rows.reduce((a, r) => a + r.t.totalTax, 0);
  const tNet = rows.reduce((a, r) => a + r.t.payable, 0);
  const ar = (k: SSort) => (sort === k ? (dir === "asc" ? "▲" : "▼") : "");

  return (
    <>
      <div className="pd-summary-chips">
        <div className="pd-schip">
          Bills<b>{rows.length}</b>
        </div>
        <div className="pd-schip">
          Gross<b>{inr(tGross)}</b>
        </div>
        <div className="pd-schip">
          Discounts<b>{inr(tDisc)}</b>
        </div>
        <div className="pd-schip">
          GST<b>{inr(tTax)}</b>
        </div>
        <div className="pd-schip">
          Net collected<b>{inr(tNet)}</b>
        </div>
      </div>

      <div className="pd-toolbar pd-no-print">
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input
            placeholder="Invoice, customer, phone…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <select
          className="pd-select"
          style={{ width: 130 }}
          value={chan}
          onChange={(e) => setChan(e.target.value as any)}
        >
          <option value="all">All channels</option>
          <option value="online">Online</option>
          <option value="offline">Counter</option>
        </select>
        <select
          className="pd-select"
          style={{ width: 120 }}
          value={pay}
          onChange={(e) => setPay(e.target.value as any)}
        >
          <option value="all">All payments</option>
          {(["cash", "upi", "card", "cod"] as PayMode[]).map((m) => (
            <option key={m} value={m}>
              {PAY_LABEL[m]}
            </option>
          ))}
        </select>
        <select
          className="pd-select"
          style={{ width: 130 }}
          value={status}
          onChange={(e) => setStatus(e.target.value as any)}
        >
          <option value="all">All statuses</option>
          {(["new", "accepted", "packed", "out", "delivered", "completed"] as OrderStatus[]).map(
            (s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ),
          )}
        </select>
        <button className={`pd-chip${rxOnly ? " on" : ""}`} onClick={() => setRxOnly((v) => !v)}>
          ℞ Rx only
        </button>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Invoice</th>
                <th
                  className={`sort${sort === "date" ? " on" : ""}`}
                  onClick={() => toggle("date")}
                >
                  Date / time<span className="ar">{ar("date")}</span>
                </th>
                <th
                  className={`sort${sort === "customer" ? " on" : ""}`}
                  onClick={() => toggle("customer")}
                >
                  Customer<span className="ar">{ar("customer")}</span>
                </th>
                <th>Channel</th>
                <th
                  className={`sort num${sort === "items" ? " on" : ""}`}
                  onClick={() => toggle("items")}
                >
                  Units<span className="ar">{ar("items")}</span>
                </th>
                <th>Payment</th>
                <th>Status</th>
                <th className="num">Disc.</th>
                <th className="num">Taxable</th>
                <th className="num">GST</th>
                <th
                  className={`sort num${sort === "total" ? " on" : ""}`}
                  onClick={() => toggle("total")}
                >
                  Total<span className="ar">{ar("total")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ s, t }) => (
                <tr key={s.id}>
                  <td className="pd-mono" style={{ fontWeight: 700 }}>
                    {s.id}
                    {s.rx && (
                      <span className="pd-tag rx" style={{ marginLeft: 5 }}>
                        Rx
                      </span>
                    )}
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{fmtDateTime(s.createdAt)}</td>
                  <td>{s.customer.name}</td>
                  <td>
                    {s.channel === "online" ? (
                      <span className="pd-pill pill-blue">Online</span>
                    ) : (
                      <span className="pd-pill pill-gray">Counter</span>
                    )}
                  </td>
                  <td className="num">{s.items.reduce((x: number, i: any) => x + i.qty, 0)}</td>
                  <td>{PAY_LABEL[s.payMode as PayMode]}</td>
                  <td>{STATUS_LABEL[s.status as OrderStatus]}</td>
                  <td className="num">{t.discount > 0 ? inr(t.discount) : "—"}</td>
                  <td className="num">{inr(t.taxable)}</td>
                  <td className="num">{inr(t.totalTax)}</td>
                  <td className="num" style={{ fontWeight: 800 }}>
                    {inr(t.payable)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={11}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconSearch size={30} />
                      </div>
                      <p>No sales match these filters.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={7}>Total · {rows.length} bills</td>
                  <td className="num">{inr(tDisc)}</td>
                  <td className="num">{inr(rows.reduce((a, r) => a + r.t.taxable, 0))}</td>
                  <td className="num">{inr(tTax)}</td>
                  <td className="num">{inr(tNet)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
