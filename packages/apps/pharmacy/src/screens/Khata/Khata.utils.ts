export function accountsWithBalance<T extends { outstanding: number }>(rows: T[]) {
  return rows.filter(function due(row) { return row.outstanding > 0; });
}
