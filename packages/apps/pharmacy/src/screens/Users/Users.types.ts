import type { StaffUser, UserRole } from "@/utils";

export const USER_ROLES: UserRole[] = ["Owner", "Manager", "Pharmacist", "Cashier"];

export type UserFormState = Partial<StaffUser>;
