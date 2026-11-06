type Seats = {
  included: number | null;
  extra: number;
  inUse: number;
  limit: number | null;
};

type Kyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: {
    bankName?: string;
    accountNumber?: string;
    ifsc?: string;
  } | null;
};

type Row = {
  id: string;
  phone: string;
  name: string;
  city: string;
  plan: string;
  cycle: string;
  status: string;
  renewsOn: string;
  businessType: string;
  seats: Seats;
  kyc: Kyc;
};

export type PharmacyListProps = {
  rows: Row[];
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  plan: string;
  setPlan: (value: string) => void;
  businessType: string;
  setBusinessType: (value: string) => void;
  window: string;
  setWindow: (value: string) => void;
  onOpen: (id: string) => void;
};
