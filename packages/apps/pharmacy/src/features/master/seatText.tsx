type Seats = { included: number | null; extra: number; inUse: number; limit: number | null };

export function seatText(seats: Seats) {
  return `${seats.inUse} in use · ${seats.included == null ? "unlimited" : seats.included} included · ${seats.extra} extra`;
}
