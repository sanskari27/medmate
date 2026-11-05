export function Table({
  columns,
  empty,
  children,
}: {
  columns: string[];
  empty: string;
  children: React.ReactNode;
}) {
  const count = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div className="pd-card">
      <div className="pd-tbl-wrap">
        <table className="pd-tbl">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column || "action"}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td colSpan={columns.length} className="pd-muted">
                  {empty}
                </td>
              </tr>
            ) : (
              children
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
