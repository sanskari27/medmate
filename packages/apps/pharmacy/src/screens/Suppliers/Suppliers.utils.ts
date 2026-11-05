export function preferredSupplyCount<T extends { preferred?: boolean }>(rows: T[]) {
  return rows.filter(function preferred(row) { return row.preferred === true; }).length;
}
