export type ClinicRole = "owner" | "doctor" | "nurse" | "front_desk" | "admin";

export type ClinicGrant =
  | "clinic:patients:read"
  | "clinic:patients:read_clinical"
  | "clinic:billing:read"
  | "clinic:staff:read";

export type ClinicMe = {
  clinicId: string;
  clinicName: string;
  role: ClinicRole;
  grants: ClinicGrant[];
};

export type PatientStatus = "waiting" | "with-doctor" | "seen" | "inactive";

/**
 * A patient as the clinic API returns it.
 *
 * The clinical fields are absent rather than null when the caller does not
 * hold `clinic:patients:read_clinical`, and `due` is absent unless the
 * caller holds `clinic:billing:read`. That is why they are all optional.
 *
 * `conditions` and `allergies` hold a comma separated list, and `lastSeen`
 * holds the name of the doctor who last saw the patient.
 */
export type ClinicPatient = {
  id: string;
  name: string;
  age: number;
  sex: string;
  phone: string;
  status: PatientStatus;
  due?: number;
  conditions?: string | null;
  allergies?: string | null;
  abha?: boolean;
  lastSeen?: string | null;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  size: number;
  total: number;
};

export type PatientSort = "name" | "last-seen";

export type PatientListFilters = {
  q?: string;
  status?: PatientStatus | "all";
  due?: boolean;
  sort?: PatientSort;
  page?: number;
  size?: number;
};
