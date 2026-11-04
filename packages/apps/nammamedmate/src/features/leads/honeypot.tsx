type HoneypotProps = {
  value: string;
  onChange: (value: string) => void;
};

/** Off-screen field. People never see it; bots that fill every input do. */
export function Honeypot({ value, onChange }: HoneypotProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: "1px",
        height: "1px",
        overflow: "hidden",
      }}
    >
      <input
        aria-label="Company website"
        name="company-website"
        tabIndex={-1}
        autoComplete="off"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
