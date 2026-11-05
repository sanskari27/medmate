export function FeatRow({
  ico,
  t,
  s,
  on,
  onClick,
}: {
  ico: React.ReactNode;
  t: string;
  s: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <div className="pd-feat">
      <span className="ico">{ico}</span>
      <div className="gw">
        <div className="t">{t}</div>
        <div className="s">{s}</div>
      </div>
      <button className={`pd-switch${on ? " on" : ""}`} onClick={onClick} />
    </div>
  );
}
