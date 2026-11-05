type Booking = {
  id: number;
  name: string;
  phone: string;
  area: string;
  note: string;
  status: string;
  at: string;
};

export type ConsultationTableProps = {
  rows: Booking[];
  onHandled: (id: number) => void;
};
