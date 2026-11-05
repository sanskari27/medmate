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

export const ymd = (ts: number) => { const d = new Date(ts); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
