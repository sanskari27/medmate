export const Section = ({ title }: { title: string }) => (
  <div
    style={{
      fontFamily: "Manrope",
      fontWeight: 800,
      fontSize: 13,
      color: "var(--muted)",
      textTransform: "uppercase",
      letterSpacing: ".04em",
      borderBottom: "1px solid var(--line)",
      paddingBottom: 6,
    }}
  >
    {title}
  </div>
);
