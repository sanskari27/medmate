import { useEffect } from "react";
import { usePharma } from "@/hooks";

export function FaultBanner() {
  const { formFault, clearFault } = usePharma();
  useEffect(() => {
    if (!formFault?.field) return;
    document
      .querySelector(`[data-field="${formFault.field}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [formFault]);
  if (!formFault) return null;
  return (
    <div className="pd-form-alert-fixed" role="alert">
      <span>{formFault.message}</span>
      <button type="button" onClick={clearFault} aria-label="Dismiss error">
        ×
      </button>
    </div>
  );
}
