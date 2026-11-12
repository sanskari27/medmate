export const PHARMACY_TYPE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "hospital", label: "Hospital" },
] as const;

export const REGISTRATION_TYPES = [
  "Proprietorship",
  "Partnership",
  "Private Limited Company",
  "LLP",
  "HUF",
  "Public Limited Company",
  "Not Registered",
] as const;

export const INDUSTRIES = [
  "Pharmacy & Healthcare",
  "Retail",
  "Wholesale",
  "Hospital / Clinic",
  "Diagnostics",
] as const;

export const BUSINESS_TYPES = [
  "Retail Pharmacy",
  "Wholesale / Distribution",
  "Hospital Pharmacy",
  "Online Pharmacy",
  "Ayurvedic / Generic",
  "Surgicals & Equipment",
] as const;

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

export const DOCUMENT_ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";
export const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp";

export function choiceOptions(values: readonly string[]) {
  return [{ value: "", label: "Select" }, ...values.map((value) => ({ value, label: value }))];
}
