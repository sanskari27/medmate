import { useState } from "react";
import { inr, catLabel, CATEGORIES, stockOf } from "@/domain";
import { IconSearch, IconBox } from "@/components/Icon";
import { monogramOf } from "@/components/entityIcon";
type PSort = "units" | "revenue" | "profit" | "margin" | "stock";

export function ProductsReport({
  enriched,
  inventory,
  costOf,
}: {
  enriched: any[];
  inventory: any[];
  costOf: (id: string) => number;
}) {
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<PSort>("revenue");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const toggle = (k: PSort) => {
    if (sort === k) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(k);
      setDir("desc");
    }
  };

  // aggregate per product
  const agg = new Map<
    string,
    { id: string; name: string; units: number; revenue: number; cogs: number }
  >();
  enriched.forEach((r: any) =>
    r.s.items.forEach((i: any) => {
      const ex = (i.price * i.qty) / (1 + i.gst / 100);
      const cur = agg.get(i.productId) ?? {
        id: i.productId,
        name: i.name,
        units: 0,
        revenue: 0,
        cogs: 0,
      };
      cur.units += i.qty;
      cur.revenue += ex;
      cur.cogs += costOf(i.productId) * i.qty;
      agg.set(i.productId, cur);
    }),
  );

  let rows = [...agg.values()].map((a) => {
    const p = inventory.find((x) => x.id === a.id);
    const profit = a.revenue - a.cogs;
    const margin = a.revenue > 0 ? (profit / a.revenue) * 100 : 0;
    const stock = p ? stockOf(p) : 0;
    return { ...a, profit, margin, stock, category: p?.category ?? "—" };
  });
  rows = rows.filter(
    (r) =>
      (cat === "all" || r.category === cat) &&
      (!q || r.name.toLowerCase().includes(q.toLowerCase())),
  );
  rows.sort((a, b) => {
    const m = dir === "asc" ? 1 : -1;
    if (sort === "units") return (a.units - b.units) * m;
    if (sort === "profit") return (a.profit - b.profit) * m;
    if (sort === "margin") return (a.margin - b.margin) * m;
    if (sort === "stock") return (a.stock - b.stock) * m;
    return (a.revenue - b.revenue) * m;
  });
  const ar = (k: PSort) => (sort === k ? (dir === "asc" ? "▲" : "▼") : "");

  // not-sold (dead stock) in this window
  const soldIds = new Set(agg.keys());
  const notSold = inventory.filter((p) => !soldIds.has(p.id)).length;

  return (
    <>
      <div className="pd-summary-chips">
        <div className="pd-schip">
          Products sold<b>{agg.size}</b>
        </div>
        <div className="pd-schip">
          Units<b>{rows.reduce((a, r) => a + r.units, 0)}</b>
        </div>
        <div className="pd-schip">
          Revenue (ex-GST)<b>{inr(rows.reduce((a, r) => a + r.revenue, 0))}</b>
        </div>
        <div className="pd-schip">
          Gross profit<b>{inr(rows.reduce((a, r) => a + r.profit, 0))}</b>
        </div>
        <div className="pd-schip">
          No sales (window)<b>{notSold}</b>
        </div>
      </div>

      <div className="pd-toolbar pd-no-print">
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input placeholder="Search product…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          className="pd-select"
          style={{ width: 160 }}
          value={cat}
          onChange={(e) => setCat(e.target.value)}
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th
                  className={`sort num${sort === "units" ? " on" : ""}`}
                  onClick={() => toggle("units")}
                >
                  Units<span className="ar">{ar("units")}</span>
                </th>
                <th
                  className={`sort num${sort === "revenue" ? " on" : ""}`}
                  onClick={() => toggle("revenue")}
                >
                  Revenue<span className="ar">{ar("revenue")}</span>
                </th>
                <th className="num">COGS</th>
                <th
                  className={`sort num${sort === "profit" ? " on" : ""}`}
                  onClick={() => toggle("profit")}
                >
                  Profit<span className="ar">{ar("profit")}</span>
                </th>
                <th
                  className={`sort num${sort === "margin" ? " on" : ""}`}
                  onClick={() => toggle("margin")}
                >
                  Margin<span className="ar">{ar("margin")}</span>
                </th>
                <th
                  className={`sort num${sort === "stock" ? " on" : ""}`}
                  onClick={() => toggle("stock")}
                >
                  In stock<span className="ar">{ar("stock")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div className="prod">
                      <span className="em">{monogramOf(r.name)}</span>
                      <span className="nm">{r.name}</span>
                    </div>
                  </td>
                  <td>{catLabel(r.category)}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {r.units}
                  </td>
                  <td className="num">{inr(r.revenue)}</td>
                  <td className="num pd-muted">{inr(r.cogs)}</td>
                  <td
                    className="num"
                    style={{
                      fontWeight: 700,
                      color: r.profit >= 0 ? "var(--green)" : "var(--rose)",
                    }}
                  >
                    {inr(r.profit)}
                  </td>
                  <td className="num">
                    <span
                      className={`pd-pill ${r.margin >= 30 ? "pill-green" : r.margin >= 15 ? "pill-gold" : "pill-rose"}`}
                    >
                      {r.margin.toFixed(0)}%
                    </span>
                  </td>
                  <td className="num">{r.stock}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconBox size={30} />
                      </div>
                      <p>No products sold in this period / filter.</p>
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
