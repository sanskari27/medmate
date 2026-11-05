export function visibleIndents<T extends { status: string; at: number }>(rows: T[], status: string) {
  return rows
    .filter(function keep(row) { return status === "all" || row.status === status; })
    .sort(function newest(left, right) { return right.at - left.at; });
}
