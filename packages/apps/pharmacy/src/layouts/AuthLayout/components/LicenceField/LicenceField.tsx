import { useRef } from "react";
import { ProfileFile } from "@/utils";
import { IconUpload } from "@/components/Icon";

export function LicenceField({
  label,
  value,
  file,
  onValue,
  onFile,
}: {
  label: string;
  value: string;
  file?: ProfileFile;
  onValue: (v: string) => void;
  onFile: (f: ProfileFile) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;
    const r = new FileReader();
    r.onload = () => onFile({ name: picked.name, dataUrl: String(r.result || "") });
    r.readAsDataURL(picked);
    e.target.value = "";
  };
  return (
    <>
      <div className="pd-field" data-field={label === "GSTIN" ? "gstin" : undefined}>
        <label>{label} *</label>
        <input
          className="pd-input pd-mono"
          value={value}
          onChange={(e) => onValue(e.target.value.toUpperCase())}
        />
      </div>
      <div className="pd-field">
        <label>{label} document *</label>
        <input ref={ref} type="file" accept="image/*,.pdf,application/pdf" hidden onChange={pick} />
        {file?.dataUrl ? (
          <div className="pd-flex pd-gap6" style={{ alignItems: "center" }}>
            <span style={{ fontSize: 12.5, fontWeight: 700 }}>{file.name}</span>
            <button
              type="button"
              className="pd-btn pd-btn-ghost pd-btn-sm"
              onClick={() => ref.current?.click()}
            >
              Replace
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="pd-btn pd-btn-ghost pd-btn-sm"
            onClick={() => ref.current?.click()}
          >
            <IconUpload size={14} /> Attach
          </button>
        )}
      </div>
    </>
  );
}
