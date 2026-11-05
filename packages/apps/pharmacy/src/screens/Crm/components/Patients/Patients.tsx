import { useState } from "react";
import { inr, timeAgo } from "@/utils";
import { Patient, Segment, SEGMENTS, segLabel } from "@/utils/calculations/crm";
import { IconSearch, IconUser } from "@/components/Icon";

export function Patients(s: any) {
  const { patients, openPatient, redeemedBy } = s;
  const [seg, setSeg] = useState<Segment | "all">("all");
  const [q, setQ] = useState("");
  const list = patients.filter(
    (p: Patient) =>
      (seg === "all" || p.segments.includes(seg)) &&
      (!q || `${p.name} ${p.phone}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <div className="pd-toolbar">
        <div className="pd-search-inline">
          <span className="ic">
            <IconSearch size={17} />
          </span>
          <input placeholder="Search patient…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          className="pd-select"
          value={seg}
          onChange={(e) => setSeg(e.target.value as any)}
          style={{ width: 180 }}
        >
          <option value="all">All segments ({patients.length})</option>
          {SEGMENTS.map((x) => (
            <option key={x.key} value={x.key}>
              {x.label} ({patients.filter((p: Patient) => p.segments.includes(x.key)).length})
            </option>
          ))}
        </select>
      </div>
      <div className="pd-card">
        <div className="pd-tbl-wrap">
          <table className="pd-tbl">
            <thead>
              <tr>
                <th>Patient</th>
                <th>Segments</th>
                <th>Tier</th>
                <th className="num">Points</th>
                <th className="num">RFM</th>
                <th className="num">Orders</th>
                <th>Last visit</th>
                <th className="num">Lifetime</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p: Patient) => (
                <tr key={p.key} style={{ cursor: "pointer" }} onClick={() => openPatient(p.key)}>
                  <td>
                    <div className="prod">
                      <span className="em">
                        <IconUser size={15} />
                      </span>
                      <span className="nm">
                        {p.name}
                        {p.chronic && (
                          <span className="pd-tag" style={{ marginLeft: 6 }}>
                            chronic
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td>
                    {p.segments.map((g) => (
                      <span
                        key={g}
                        className="pd-pill pill-gray"
                        style={{ marginRight: 4, fontSize: 11 }}
                      >
                        {segLabel(g)}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className="pd-pill pill-gold">{p.tier}</span>
                  </td>
                  <td className="num" style={{ fontWeight: 700 }}>
                    {Math.max(0, p.points - (redeemedBy.get(p.key) ?? 0))}
                  </td>
                  <td className="num">{p.rfm.score}</td>
                  <td className="num">{p.orders}</td>
                  <td>{timeAgo(p.lastAt, s.now)}</td>
                  <td className="num" style={{ fontWeight: 800 }}>
                    {inr(p.spent)}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={8}>
                    <div className="pd-empty">
                      <div className="em">
                        <IconSearch size={30} />
                      </div>
                      <p>No patients in this segment.</p>
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
