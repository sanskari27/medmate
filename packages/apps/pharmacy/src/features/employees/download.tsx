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

export const download = (blob: Blob, name: string) => { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(u), 6000); };
