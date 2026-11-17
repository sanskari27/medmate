export type ClinicMe = {
  clinicId: string;
  clinicName: string;
  role: string;
  grants: string[];
};

export type ClinicPatient = {
  id: string;
  [key: string]: unknown;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};
