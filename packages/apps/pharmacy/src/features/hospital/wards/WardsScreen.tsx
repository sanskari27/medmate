import { AdmissionsTable } from "./AdmissionsTable";
import { WardSetupModal } from "./WardSetupModal";
import { AdmitModal } from "./AdmitModal";
import { AdmissionModal } from "./AdmissionModal";
import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  WardType,
  wardBedNos,
  occupiedBedsOf,
  admissionAtBed,
  hospitalOccupancy,
  activeAdmissions,
} from "@/features/hospital/hospital";
import { IconPlus, IconSettings } from "@/components/Icon";

const TYPE_TONE: Record<WardType, string> = {
  ICU: "pill-rose",
  General: "pill-gray",
  Surgical: "pill-blue",
  Pediatric: "pill-gold",
  Maternity: "pill-teal",
  Private: "pill-green",
};

export default function WardsScreen() {
  const { wards, admissions, sales, now } = usePharma();
  const [tab, setTab] = useState<"beds" | "admissions">("beds");
  const [setup, setSetup] = useState(false);
  const [admit, setAdmit] = useState<{ wardId: string; bed: string } | true | null>(null);
  const [viewAdm, setViewAdm] = useState<string | null>(null);

  const occ = hospitalOccupancy(wards, admissions);
  const active = activeAdmissions(admissions);
  const current = admissions.find((a) => a.id === viewAdm) ?? null;

  return (
    <div className="pd-canvas-wide">
      <div className="pd-summary-chips" style={{ marginBottom: 16 }}>
        <div className="pd-schip">
          Wards<b>{wards.length}</b>
        </div>
        <div className="pd-schip">
          Total beds<b>{occ.beds}</b>
        </div>
        <div className="pd-schip">
          Occupied<b>{occ.occ}</b>
        </div>
        <div className="pd-schip">
          Free<b>{occ.free}</b>
        </div>
        <div className="pd-schip">
          Occupancy<b>{occ.pct}%</b>
        </div>
        <div className="pd-schip">
          Admitted<b>{active.length}</b>
        </div>
      </div>

      <div className="pd-toolbar">
        <div className="pd-seg">
          <button className={tab === "beds" ? "on" : ""} onClick={() => setTab("beds")}>
            Bed map
          </button>
          <button className={tab === "admissions" ? "on" : ""} onClick={() => setTab("admissions")}>
            Admissions ({active.length})
          </button>
        </div>
        <div className="pd-spacer" />
        <button className="pd-btn pd-btn-ghost" onClick={() => setSetup(true)}>
          <IconSettings size={14} /> Manage wards
        </button>
        <button className="pd-btn pd-btn-primary" onClick={() => setAdmit(true)}>
          <IconPlus size={16} /> Admit patient
        </button>
      </div>

      {tab === "beds" ? (
        <div className="pd-grid-cards" style={{ marginTop: 16 }}>
          {wards.map((w) => {
            const occSet = occupiedBedsOf(admissions, w.id);
            const beds = wardBedNos(w);
            const pct = w.beds ? Math.round((occSet.size / w.beds) * 100) : 0;
            return (
              <div className="pd-card pd-card-pad" key={w.id}>
                <div
                  className="pd-flex"
                  style={{ justifyContent: "space-between", alignItems: "flex-start" }}
                >
                  <div>
                    <h3 style={{ fontSize: 16 }}>{w.name}</h3>
                    <div className="pd-muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                      {w.code} · {w.floor} · {w.sister}
                    </div>
                  </div>
                  <span className={`pd-pill ${TYPE_TONE[w.type]}`}>{w.type}</span>
                </div>
                <div
                  className="pd-flex"
                  style={{ justifyContent: "space-between", fontSize: 12.5, margin: "12px 0 5px" }}
                >
                  <span className="pd-muted">
                    {occSet.size}/{w.beds} beds occupied
                  </span>
                  <b
                    style={{
                      color: pct >= 85 ? "var(--rose)" : pct >= 60 ? "var(--amber)" : "var(--mid)",
                    }}
                  >
                    {pct}%
                  </b>
                </div>
                <div className={`pd-prog${pct >= 85 ? " rose" : pct >= 60 ? " amber" : ""}`}>
                  <i style={{ width: pct + "%" }} />
                </div>
                <div className="pd-bedgrid">
                  {beds.map((bed) => {
                    const a = admissionAtBed(admissions, w.id, bed);
                    return (
                      <button
                        key={bed}
                        className={`pd-bed${a ? " occ" : " free"}`}
                        title={a ? `${a.name} · ${a.patientId}` : `${bed} · free`}
                        onClick={() => (a ? setViewAdm(a.id) : setAdmit({ wardId: w.id, bed }))}
                      >
                        <span className="no">{bed}</span>
                        <span className="pt">{a ? a.name.split(" ")[0] : "+ Free"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <AdmissionsTable admissions={active} sales={sales} now={now} onOpen={setViewAdm} />
      )}

      {setup && <WardSetupModal onClose={() => setSetup(false)} />}
      {admit && (
        <AdmitModal
          preset={admit === true ? null : admit}
          onClose={() => setAdmit(null)}
          onAdmitted={(id) => {
            setAdmit(null);
            setViewAdm(id);
          }}
        />
      )}
      {current && <AdmissionModal adm={current} onClose={() => setViewAdm(null)} />}
    </div>
  );
}

/* ── admissions table ───────────────────────────────────────── */

/* ── ward setup (add / edit / remove wards) ─────────────────── */

/* ── admit patient ──────────────────────────────────────────── */

/* ── admission detail · bills · settle & discharge ──────────── */
