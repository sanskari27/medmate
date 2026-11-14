export const REGIONS = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Andaman and Nicobar Islands",
  "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Lakshadweep",
  "Puducherry",
] as const;

export const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const WORKPLACE_TYPES = [
  { value: "clinic", label: "Clinic" },
  { value: "hospital", label: "Hospital" },
  { value: "nursing-home", label: "Nursing home" },
] as const;

export const RELATIONSHIPS = [
  { value: "in-house", label: "In-house" },
  { value: "visiting", label: "Visiting" },
  { value: "on-call", label: "On-call" },
] as const;

export const CONSULTATION_TYPES = [
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
  { value: "both", label: "Both" },
] as const;

export const DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

export const VERIFICATION = [
  { value: "pending", label: "Pending" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
] as const;

export type DoctorStatus = "active" | "inactive";
export type VerificationStatus = "pending" | "verified" | "rejected";

export type DoctorFile = {
  fileName: string;
  contentType: string;
  url: string;
};

export type DoctorDocument = {
  id: string;
  documentType: string;
  fileName: string;
  contentType: string;
  verificationStatus: VerificationStatus;
  url: string;
};

export type DoctorWindow = {
  type: "online" | "offline" | "both";
  days: string[];
  start: string;
  end: string;
  fee: string;
};

export type DoctorDepartment = {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
};

export type Doctor = {
  id: string;
  code: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  status: DoctorStatus;
  registrationNumber: string;
  registrationCouncil: string | null;
  registrationState: string | null;
  qualification: string;
  specialization: string;
  subSpecialization: string | null;
  yearsExperience: number | null;
  primaryMobile: string;
  alternateMobile: string | null;
  email: string | null;
  whatsapp: string | null;
  relationshipStatus: string | null;
  notes: string | null;
  workplaceName: string;
  workplaceType: string | null;
  address: string | null;
  city: string;
  state: string;
  pinCode: string;
  workplacePhone: string | null;
  photo: DoctorFile | null;
  windows: DoctorWindow[];
  documents: DoctorDocument[];
  department: DoctorDepartment | null;
};

export type DoctorList = { doctors: Doctor[] };
export type DoctorOne = { doctor: Doctor };

export type WindowDraft = {
  type: "online" | "offline" | "both";
  days: string[];
  start: string;
  end: string;
  fee: string;
};

export type DoctorDraft = {
  code: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  status: DoctorStatus;
  registrationNumber: string;
  registrationCouncil: string;
  registrationState: string;
  qualification: string;
  specialization: string;
  subSpecialization: string;
  yearsExperience: string;
  primaryMobile: string;
  alternateMobile: string;
  email: string;
  whatsapp: string;
  relationshipStatus: string;
  notes: string;
  workplaceName: string;
  workplaceType: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  workplacePhone: string;
  windows: WindowDraft[];
  departmentId: string;
};

export type PendingDocument = {
  documentType: string;
  verificationStatus: VerificationStatus;
  file: File;
};

export type StoredDocumentDraft = {
  id: string;
  documentType: string;
  fileName: string;
  verificationStatus: VerificationStatus;
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const FEE = /^\d+(\.\d{1,2})?$/;
const PIN = /^[1-9][0-9]{5}$/;
const MOBILE = /^(\+91)?[6-9][0-9]{9}$/;

export function canOpenDoctors(
  role: string | null | undefined,
  permissions: string[] | undefined,
  pharmacyType: string | null | undefined,
): boolean {
  if (pharmacyType !== "hospital") return false;
  return role === "owner" || (permissions ?? []).includes("doctors:read");
}

export function doctorAccess(role: string | null | undefined, permissions: string[] | undefined) {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("doctors:create"),
    update: owner || keys.includes("doctors:update"),
  };
}

export function blankWindow(): WindowDraft {
  return { type: "offline", days: ["monday"], start: "09:00", end: "13:00", fee: "0" };
}

export function blankDraft(): DoctorDraft {
  return {
    code: "",
    firstName: "",
    lastName: "",
    displayName: "",
    gender: "",
    status: "active",
    registrationNumber: "",
    registrationCouncil: "",
    registrationState: "",
    qualification: "",
    specialization: "",
    subSpecialization: "",
    yearsExperience: "",
    primaryMobile: "",
    alternateMobile: "",
    email: "",
    whatsapp: "",
    relationshipStatus: "",
    notes: "",
    workplaceName: "",
    workplaceType: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    workplacePhone: "",
    windows: [blankWindow()],
    departmentId: "",
  };
}

export function draftFromDoctor(doctor: Doctor): DoctorDraft {
  return {
    code: doctor.code,
    firstName: doctor.firstName,
    lastName: doctor.lastName,
    displayName: doctor.displayName,
    gender: doctor.gender,
    status: doctor.status,
    registrationNumber: doctor.registrationNumber,
    registrationCouncil: doctor.registrationCouncil ?? "",
    registrationState: doctor.registrationState ?? "",
    qualification: doctor.qualification,
    specialization: doctor.specialization,
    subSpecialization: doctor.subSpecialization ?? "",
    yearsExperience: doctor.yearsExperience == null ? "" : String(doctor.yearsExperience),
    primaryMobile: doctor.primaryMobile,
    alternateMobile: doctor.alternateMobile ?? "",
    email: doctor.email ?? "",
    whatsapp: doctor.whatsapp ?? "",
    relationshipStatus: doctor.relationshipStatus ?? "",
    notes: doctor.notes ?? "",
    workplaceName: doctor.workplaceName,
    workplaceType: doctor.workplaceType ?? "",
    address: doctor.address ?? "",
    city: doctor.city,
    state: doctor.state,
    pinCode: doctor.pinCode,
    workplacePhone: doctor.workplacePhone ?? "",
    windows: doctor.windows.length
      ? doctor.windows.map((window) => ({
          type: window.type,
          days: [...window.days],
          start: window.start,
          end: window.end,
          fee: window.fee,
        }))
      : [blankWindow()],
    departmentId: doctor.department?.id ?? "",
  };
}

export function windowIsValid(window: WindowDraft): boolean {
  return Boolean(
    window.type &&
    window.days.length > 0 &&
    TIME.test(window.start) &&
    TIME.test(window.end) &&
    window.start < window.end &&
    FEE.test(window.fee.trim()),
  );
}

export function draftIsValid(draft: DoctorDraft): boolean {
  const years = draft.yearsExperience.trim();
  const yearsOk = years === "" || (/^\d+$/.test(years) && Number(years) <= 99);
  const email = draft.email.trim();
  const emailOk = email === "" || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  return Boolean(
    draft.code.trim() &&
    draft.code.trim().length <= 32 &&
    draft.firstName.trim() &&
    draft.lastName.trim() &&
    draft.displayName.trim() &&
    draft.gender &&
    draft.status &&
    MOBILE.test(draft.primaryMobile.replace(/\s/g, "")) &&
    draft.registrationNumber.trim() &&
    draft.qualification.trim() &&
    draft.specialization.trim() &&
    draft.workplaceName.trim() &&
    draft.city.trim() &&
    (REGIONS as readonly string[]).includes(draft.state) &&
    PIN.test(draft.pinCode.trim()) &&
    yearsOk &&
    emailOk &&
    draft.windows.length > 0 &&
    draft.windows.every(windowIsValid),
  );
}

export type DoctorPayload = {
  code: string;
  firstName: string;
  lastName: string;
  displayName: string;
  gender: string;
  status: DoctorStatus;
  registrationNumber: string;
  registrationCouncil: string;
  registrationState: string;
  qualification: string;
  specialization: string;
  subSpecialization: string;
  yearsExperience: string;
  primaryMobile: string;
  alternateMobile: string;
  email: string;
  whatsapp: string;
  relationshipStatus: string;
  notes: string;
  workplaceName: string;
  workplaceType: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  workplacePhone: string;
  windows: WindowDraft[];
  documents: { id: string; verificationStatus: VerificationStatus }[];
  departmentId: string | null;
  removePhoto?: boolean;
};

export function payload(
  draft: DoctorDraft,
  documents: StoredDocumentDraft[],
  removePhoto = false,
): DoctorPayload {
  return {
    code: draft.code.trim(),
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    displayName: draft.displayName.trim(),
    gender: draft.gender,
    status: draft.status,
    registrationNumber: draft.registrationNumber.trim(),
    registrationCouncil: draft.registrationCouncil.trim(),
    registrationState: draft.registrationState,
    qualification: draft.qualification.trim(),
    specialization: draft.specialization.trim(),
    subSpecialization: draft.subSpecialization.trim(),
    yearsExperience: draft.yearsExperience.trim(),
    primaryMobile: draft.primaryMobile.trim(),
    alternateMobile: draft.alternateMobile.trim(),
    email: draft.email.trim(),
    whatsapp: draft.whatsapp.trim(),
    relationshipStatus: draft.relationshipStatus,
    notes: draft.notes.trim(),
    workplaceName: draft.workplaceName.trim(),
    workplaceType: draft.workplaceType,
    address: draft.address.trim(),
    city: draft.city.trim(),
    state: draft.state,
    pinCode: draft.pinCode.trim(),
    workplacePhone: draft.workplacePhone.trim(),
    windows: draft.windows.map((window) => ({
      ...window,
      fee: window.fee.trim(),
    })),
    documents: documents.map((document) => ({
      id: document.id,
      verificationStatus: document.verificationStatus,
    })),
    departmentId: draft.departmentId.trim() ? draft.departmentId.trim() : null,
    ...(removePhoto ? { removePhoto: true } : {}),
  };
}

export function toFormData(
  draft: DoctorDraft,
  documents: StoredDocumentDraft[],
  photo: File | null,
  removePhoto: boolean,
  pending: PendingDocument[],
): FormData {
  const body = new FormData();
  const fields = payload(draft, documents, removePhoto);
  for (const [key, value] of Object.entries(fields)) {
    if (key === "windows") body.set("windows", JSON.stringify(value));
    else if (key === "documents") body.set("documentUpdates", JSON.stringify(value));
    else if (key === "removePhoto") body.set("removePhoto", "true");
    else if (key === "departmentId") body.set("departmentId", value ? String(value) : "");
    else body.set(key, String(value));
  }
  if (photo) body.set("photo", photo);
  for (const document of pending) {
    body.append("documentTypes", document.documentType.trim());
    body.append("documentStatuses", document.verificationStatus);
    body.append("documents", document.file);
  }
  return body;
}

export function filterDoctors(
  doctors: Doctor[],
  filters: { query: string; status: string },
): Doctor[] {
  const needle = filters.query.trim().toLowerCase();
  return doctors.filter((doctor) => {
    if (filters.status !== "all" && doctor.status !== filters.status) return false;
    if (!needle) return true;
    return `${doctor.displayName} ${doctor.firstName} ${doctor.lastName} ${doctor.code} ${doctor.primaryMobile} ${doctor.specialization}`
      .toLowerCase()
      .includes(needle);
  });
}

export function relationshipLabel(value: string | null): string {
  return RELATIONSHIPS.find((item) => item.value === value)?.label ?? "";
}
