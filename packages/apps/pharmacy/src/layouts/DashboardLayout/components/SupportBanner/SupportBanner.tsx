import { usePharma } from "@/store/slices/session";

export function SupportBanner() {
  const { impersonator, profile, signOut } = usePharma();
  if (!impersonator) return null;
  return (
    <div
      role="status"
      className="pd-form-alert"
      style={{
        position: "fixed",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "max-content",
        maxWidth: "calc(100% - 16px)",
        margin: 0,
        padding: "4px 4px 4px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        Support · {profile.name} · {impersonator}
      </span>
      <button
        className="pd-btn pd-btn-sm"
        style={{ padding: "3px 8px", fontSize: 11 }}
        onClick={signOut}
      >
        Exit
      </button>
    </div>
  );
}
