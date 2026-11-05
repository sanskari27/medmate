import { useState } from "react";
import { InvProduct, stockOf, hasLocation, locationCodes } from "@/utils";
import { Thumb } from "@/components/Thumb";

export function AssignRow({
  p,
  checked,
  onToggle,
  onSave,
  fillCode,
}: {
  p: InvProduct;
  checked: boolean;
  onToggle: () => void;
  onSave: (v: string) => void;
  fillCode: string;
}) {
  const [val, setVal] = useState(p.rack || "");
  const dirty = val.trim() !== (p.rack || "").trim();
  return (
    <tr>
      <td>
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          aria-label={`Select ${p.name}`}
        />
      </td>
      <td>
        <div className="prod">
          <span className="em">
            <Thumb p={p} />
          </span>
          <span>
            <span className="nm">{p.name}</span>
            <div className="sub">{p.composition}</div>
          </span>
        </div>
      </td>
      <td>
        <span className={`pd-pill ${stockOf(p) === 0 ? "pill-rose" : "pill-gray"}`}>
          {stockOf(p)}
        </span>
      </td>
      <td className="pd-mono">
        {hasLocation(p) ? locationCodes(p).join(" · ") : <span className="pd-muted">—</span>}
      </td>
      <td>
        <div className="pd-flex pd-gap6">
          <input
            className="pd-input pd-mono"
            data-field="rack"
            style={{ width: 96 }}
            value={val}
            onChange={(e) => setVal(e.target.value.toUpperCase())}
            placeholder={fillCode || "A3-12"}
          />
          {fillCode && val.trim() !== fillCode && (
            <button
              className="pd-iconbtn"
              title={`Use ${fillCode}`}
              onClick={() => setVal(fillCode)}
            >
              ↤
            </button>
          )}
          <button
            className="pd-btn pd-btn-sm pd-btn-primary"
            disabled={!dirty || !val.trim()}
            onClick={() => onSave(val.trim())}
          >
            Save
          </button>
        </div>
      </td>
    </tr>
  );
}
