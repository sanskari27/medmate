export type DepartmentParent = {
  id: string;
  name: string;
  code: string;
};

export type Department = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  displayOrder: number;
  parent: DepartmentParent | null;
};

export type DepartmentList = { departments: Department[] };
export type DepartmentOne = { department: Department };

export type DepartmentDraft = {
  name: string;
  code: string;
  description: string;
  parentDepartmentId: string;
  displayOrder: string;
  isActive: boolean;
};

export type DepartmentPayload = {
  name: string;
  code: string;
  description: string;
  parentDepartmentId: string | null;
  displayOrder: number;
  isActive: boolean;
};

const ORDER = /^\d+$/;

export function canOpenDepartments(
  role: string | null | undefined,
  permissions: string[] | undefined,
  pharmacyType: string | null | undefined,
): boolean {
  if (pharmacyType !== "hospital") return false;
  return role === "owner" || (permissions ?? []).includes("departments:read");
}

export function departmentAccess(
  role: string | null | undefined,
  permissions: string[] | undefined,
) {
  const owner = role === "owner";
  const keys = permissions ?? [];
  return {
    create: owner || keys.includes("departments:create"),
    update: owner || keys.includes("departments:update"),
  };
}

export function blankDraft(): DepartmentDraft {
  return {
    name: "",
    code: "",
    description: "",
    parentDepartmentId: "",
    displayOrder: "0",
    isActive: true,
  };
}

export function draftFromDepartment(department: Department): DepartmentDraft {
  return {
    name: department.name,
    code: department.code,
    description: department.description ?? "",
    parentDepartmentId: department.parent?.id ?? "",
    displayOrder: String(department.displayOrder),
    isActive: department.isActive,
  };
}

export function draftIsValid(draft: DepartmentDraft): boolean {
  return Boolean(
    draft.name.trim() &&
    draft.name.trim().length <= 100 &&
    draft.code.trim() &&
    draft.code.trim().length <= 30 &&
    ORDER.test(draft.displayOrder.trim()),
  );
}

export function payload(draft: DepartmentDraft): DepartmentPayload {
  const parent = draft.parentDepartmentId.trim();
  return {
    name: draft.name.trim(),
    code: draft.code.trim(),
    description: draft.description.trim(),
    parentDepartmentId: parent ? parent : null,
    displayOrder: Number(draft.displayOrder.trim()),
    isActive: draft.isActive,
  };
}

export function filterDepartments(
  departments: Department[],
  filters: { query: string; status: string },
): Department[] {
  const needle = filters.query.trim().toLowerCase();
  return departments.filter((department) => {
    if (filters.status === "active" && !department.isActive) return false;
    if (filters.status === "inactive" && department.isActive) return false;
    if (!needle) return true;
    return `${department.name} ${department.code} ${department.parent?.name ?? ""}`
      .toLowerCase()
      .includes(needle);
  });
}

export function departmentLabel(department: { name: string; code: string }): string {
  return `${department.name} (${department.code})`;
}

export function parentChoices(departments: Department[], selfId: string | null): Department[] {
  const excluded = new Set<string>();
  if (selfId) {
    const children = new Map<string, string[]>();
    for (const department of departments) {
      if (!department.parent) continue;
      const list = children.get(department.parent.id) ?? [];
      list.push(department.id);
      children.set(department.parent.id, list);
    }
    const stack = [selfId];
    while (stack.length > 0) {
      const id = stack.pop();
      if (!id || excluded.has(id)) continue;
      excluded.add(id);
      stack.push(...(children.get(id) ?? []));
    }
  }
  return departments.filter((department) => !excluded.has(department.id));
}

export function doctorDepartmentChoices<
  T extends { id: string; name: string; code: string; isActive: boolean },
>(
  departments: T[],
  current: { id: string; name: string; code: string; isActive: boolean } | null,
): Array<{ id: string; name: string; code: string; isActive: boolean }> {
  const choices = departments.filter(
    (department) => department.isActive || department.id === current?.id,
  );
  if (current && !current.isActive && !choices.some((department) => department.id === current.id)) {
    return [...choices, current];
  }
  return choices;
}
