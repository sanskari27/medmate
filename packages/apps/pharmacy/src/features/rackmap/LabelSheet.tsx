import { InvProduct } from "@/domain";
import { IconPrint, IconX } from "@/components/Icon";

export function LabelSheet({
  groups,
  onClose,
}: {
  groups: { code: string; zone: string; items: InvProduct[] }[];
  onClose: () => void;
}) {
  return (
    <div className="pd-modal-wrap" onClick={onClose}>
      <div className="pd-modal lg" onClick={(e) => e.stopPropagation()}>
        <div className="pd-modal-head pd-no-print">
          <h3>Rack labels · {groups.length} locations</h3>
          <button className="pd-x" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>
        <div className="pd-modal-body">
          <p className="pd-muted pd-no-print" style={{ fontSize: 12.5, marginBottom: 12 }}>
            Print, cut along the boxes, and stick each label on its matching bin. The code must read
            identically on the shelf and on screen.
          </p>
          <div className="pd-labelsheet pd-print-area">
            {groups.map((g) => (
              <div className="pd-label" key={g.code}>
                <div className="zone">RACK {g.zone}</div>
                <div className="code">{g.code}</div>
                <div className="brand">
                  <em>Namma</em> <b>MedMate</b>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pd-modal-foot pd-no-print">
          <button className="pd-btn pd-btn-ghost" onClick={onClose}>
            Close
          </button>
          <button className="pd-btn pd-btn-primary" onClick={() => window.print()}>
            <IconPrint size={15} /> Print labels
          </button>
        </div>
      </div>
    </div>
  );
}
