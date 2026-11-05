import { useMemo, useRef, useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";
import {
  inr, Employee, EMPLOYEE_POSITIONS, EMPLOYMENT_TYPES, EmploymentType, BLOOD_GROUPS,
  blankEmployee, employeeTenure, monthlyPayroll, maskAccount, isValidIfsc,
  DOC_LABELS, EmployeeDoc,
} from "@/domain";
import { IconPlus, IconSearch, IconPrint, IconUpload, IconIdCard, IconUser, IconX, IconUsers, IconCash, IconRupee, IconDoc, IconImage, IconTrash, IconBriefcase, IconArrowRight } from "@/components/Icon"
import { Avatar } from "@/components/entityIcon";
import EmployeeIdCard from "@/features/employees/EmployeeIdCard";

;

export const Field = ({ label, children, field }: { label: string; children: React.ReactNode; field?: string }) => (
  <div className="pd-field" data-field={field}><label>{label}</label>{children}</div>
);
