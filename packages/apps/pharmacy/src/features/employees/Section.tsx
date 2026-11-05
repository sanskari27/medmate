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

export const Section = ({ title }: { title: string }) => (
  <div style={{ fontFamily: "Manrope", fontWeight: 800, fontSize: 13, color: "var(--muted)", textTransform: "uppercase", letterSpacing: ".04em", borderBottom: "1px solid var(--line)", paddingBottom: 6 }}>{title}</div>
);
