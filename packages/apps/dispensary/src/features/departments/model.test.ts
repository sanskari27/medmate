import { describe, expect, it } from "vitest";
import {
  blankDraft,
  draftIsValid,
  filterDepartments,
  parentChoices,
  type Department,
} from "./model";

const medicine: Department = {
  id: "med",
  name: "Medicine",
  code: "MED",
  description: null,
  isActive: true,
  displayOrder: 2,
  parent: null,
};

const cardio: Department = {
  id: "card",
  name: "Cardiology",
  code: "CARD",
  description: "Heart",
  isActive: false,
  displayOrder: 1,
  parent: { id: "med", name: "Medicine", code: "MED" },
};

const echo: Department = {
  id: "echo",
  name: "Echo",
  code: "ECHO",
  description: null,
  isActive: true,
  displayOrder: 0,
  parent: { id: "card", name: "Cardiology", code: "CARD" },
};

describe("department draft", () => {
  it("starts active at order 0 and refuses a blank name or code", () => {
    const draft = blankDraft();
    expect(draft.isActive).toBe(true);
    expect(draft.displayOrder).toBe("0");
    expect(draft.parentDepartmentId).toBe("");
    expect(draftIsValid(draft)).toBe(false);
    expect(draftIsValid({ ...draft, name: "Cardiology", code: "CARD" })).toBe(true);
    expect(draftIsValid({ ...draft, name: "Cardiology", code: "CARD", displayOrder: "-1" })).toBe(
      false,
    );
    expect(draftIsValid({ ...draft, name: "Cardiology", code: "CARD", displayOrder: "1.5" })).toBe(
      false,
    );
  });
});

describe("department search", () => {
  it("matches name, code, and parent name", () => {
    const rows = [medicine, cardio, echo];
    expect(
      filterDepartments(rows, { query: "echo", status: "all" }).map((row) => row.code),
    ).toEqual(["ECHO"]);
    expect(
      filterDepartments(rows, { query: "card", status: "all" }).map((row) => row.code),
    ).toEqual(["CARD", "ECHO"]);
    expect(
      filterDepartments(rows, { query: "", status: "inactive" }).map((row) => row.code),
    ).toEqual(["CARD"]);
    expect(filterDepartments(rows, { query: "missing", status: "all" })).toEqual([]);
  });
});

describe("department parents", () => {
  it("drops the department itself and its descendants", () => {
    const rows = [medicine, cardio, echo];
    expect(parentChoices(rows, null).map((row) => row.code)).toEqual(["MED", "CARD", "ECHO"]);
    expect(parentChoices(rows, "med").map((row) => row.code)).toEqual([]);
    expect(parentChoices(rows, "card").map((row) => row.code)).toEqual(["MED"]);
    expect(parentChoices(rows, "echo").map((row) => row.code)).toEqual(["MED", "CARD"]);
  });
});
