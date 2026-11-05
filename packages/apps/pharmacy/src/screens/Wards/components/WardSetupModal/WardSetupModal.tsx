import { useState } from "react";
import { usePharma } from "@/store/slices/session";
import { Ward, WardType, WARD_TYPES } from "@/utils/calculations/hospital";
import { IconPlus, IconX } from "@/components/Icon";

export function WardSetupModal({ onClose }: { onClose: () => void }) {
  const { wards, addWard, updateWard } = usePharma();
  const [draft, setDraft] = useState<Omit<Ward, "id">>({
    name: "",
    code: "",
    floor: "",
    type: "General",
    beds: 10,
    occupied: 0,
    sister: "",
  });
  const setD = (p: Partial<Ward>) => setDraft((s) => ({ ...s, ...p }));
  const add = async () => {
    if (!draft.name.trim() || !draft.code.trim()) return;
    const err = await addWard(draft);
    if (!err)
      setDraft({
        name: "",
        code: "",
        floor: "",
        type: "General",
        beds: 10,
        occupied: 0,
        sister: "",
      });
  };

  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head">
          <h3>Manage wards & beds</h3>
          <button className="pd-iconbtn" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <div className="pd-tbl-wrap">
            <table className="pd-tbl">
              <thead>
                <tr>
                  <th>Ward name</th>
                  <th>Code</th>
                  <th>Floor</th>
                  <th>Category</th>
                  <th>Beds</th>
                  <th>Nurse in-charge</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {wards.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <input
                        className="pd-input"
                        value={w.name}
                        onChange={(e) => updateWard(w.id, { name: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="pd-input pd-mono"
                        style={{ width: 90 }}
                        value={w.code}
                        onChange={(e) => updateWard(w.id, { code: e.target.value.toUpperCase() })}
                      />
                    </td>
                    <td>
                      <input
                        className="pd-input"
                        style={{ width: 110 }}
                        value={w.floor}
                        onChange={(e) => updateWard(w.id, { floor: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="pd-select"
                        value={w.type}
                        onChange={(e) => updateWard(w.id, { type: e.target.value as WardType })}
                      >
                        {WARD_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="pd-input"
                        type="number"
                        min={0}
                        style={{ width: 70 }}
                        value={w.beds}
                        onChange={(e) =>
                          updateWard(w.id, { beds: Math.max(0, Number(e.target.value) || 0) })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="pd-input"
                        value={w.sister}
                        onChange={(e) => updateWard(w.id, { sister: e.target.value })}
                      />
                    </td>
                    <td />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div
            className="pd-card pd-card-pad"
            style={{ marginTop: 16, background: "var(--wash2)" }}
          >
            <b style={{ display: "block", marginBottom: 10 }}>Add a ward</b>
            <div className="pd-form-grid">
              <div className="pd-field pd-span2" data-field="name">
                <label>Ward name</label>
                <input
                  className="pd-input"
                  value={draft.name}
                  onChange={(e) => setD({ name: e.target.value })}
                  placeholder="e.g. Orthopaedic Ward"
                />
              </div>
              <div className="pd-field">
                <label>Code / bed prefix</label>
                <input
                  className="pd-input pd-mono"
                  value={draft.code}
                  onChange={(e) => setD({ code: e.target.value.toUpperCase() })}
                  placeholder="ORT"
                />
              </div>
              <div className="pd-field">
                <label>Floor</label>
                <input
                  className="pd-input"
                  value={draft.floor}
                  onChange={(e) => setD({ floor: e.target.value })}
                  placeholder="3rd floor"
                />
              </div>
              <div className="pd-field">
                <label>Category</label>
                <select
                  className="pd-select"
                  value={draft.type}
                  onChange={(e) => setD({ type: e.target.value as WardType })}
                >
                  {WARD_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="pd-field">
                <label>Bed capacity</label>
                <input
                  className="pd-input"
                  type="number"
                  min={1}
                  value={draft.beds || ""}
                  onChange={(e) => setD({ beds: Math.max(0, Number(e.target.value) || 0) })}
                />
              </div>
              <div className="pd-field pd-span2">
                <label>Nurse in-charge</label>
                <input
                  className="pd-input"
                  value={draft.sister}
                  onChange={(e) => setD({ sister: e.target.value })}
                  placeholder="Sr. …"
                />
              </div>
            </div>
            <button
              className="pd-btn pd-btn-primary"
              style={{ marginTop: 12 }}
              disabled={!draft.name.trim() || !draft.code.trim()}
              onClick={add}
            >
              <IconPlus size={15} /> Add ward · {draft.beds} beds ({draft.code}-1…{draft.code}-
              {draft.beds})
            </button>
          </div>
        </div>
        <div className="pd-modal-foot">
          <div className="pd-spacer" />
          <button className="pd-btn pd-btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
