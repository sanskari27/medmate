export type PatientSummaryProps = {
  name: string;
  initials?: string;
  phone?: string;
  email?: string;
  lastSeen?: string;
  doctor?: string;
  tier?: string;
  chronic?: boolean;
  kind?: string;
  segments?: string[];
  onOpen?: () => void;
  className?: string;
};
