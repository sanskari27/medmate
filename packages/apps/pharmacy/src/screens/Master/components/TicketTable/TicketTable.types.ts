type Ticket = {
  id: string;
  subject: string;
  status: string;
  pharmacyId?: string;
  pharmacyName?: string;
  category?: string;
};

export type TicketTableProps = {
  tickets: Ticket[];
  onResolve: (ticket: Ticket) => void;
};
