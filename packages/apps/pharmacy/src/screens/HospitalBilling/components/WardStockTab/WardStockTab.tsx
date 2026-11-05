import { useState } from "react";
import { usePharma } from "@/hooks";
import { inr } from "@/utils";
import { wardOnHand } from "@/utils/calculations/hospitalAccount";

import { useCreditPrice } from "@/screens/HospitalBilling/hooks/useCreditPrice";

export function WardStockTab() {
  const { wardSupplies, wards } = usePharma();
  const cp = useCreditPrice();
  const [w, setW] = useState("all");
  const rows = wardOnHand(wardSupplies, cp, w === "all" ? undefined : w);
  const totalVal = rows.reduce((a, r) => a + r.value, 0);
  return (
    <>
      <div className="pd-toolbar" style={{ marginBottom: 14 }}>
        <select className="pd-select" value={w} onChange={(e) => setW(e.target.value)}>
          <option value="all">All wards</option>
          {wards.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <div className="pd-spacer" />
        <span className="pd-muted" style={{ fontSize: 13 }}>
          Stock currently held in wards (valued at credit price)
        </span>
      </div>
      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Ward</th>
                <th>Medicine</th>
                <th className="num">On hand</th>
                <th className="num">Credit price</th>
                <th className="num">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.wardId + r.productId}>
                  <td>{r.wardName}</td>
                  <td>{r.name}</td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {r.qty}
                  </td>
                  <td className="num">{inr(r.price)}</td>
                  <td className="num" style={{ fontWeight: 800 }}>
                    {inr(r.value)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5}>
                    <div className="pd-empty">No ward stock on hand.</div>
                  </td>
                </tr>
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>
                    Total ward stock value
                  </td>
                  <td className="num" style={{ fontWeight: 800 }}>
                    {inr(totalVal)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
