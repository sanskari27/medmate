import { describe, expect, it } from "vitest";
import { doctorsInDepartment } from "./Departments.utils";

describe("doctorsInDepartment", () => {
  it("keeps doctors whose department matches the name", () => {
    const doctors = [{ department: "ICU" }, { department: "OPD" }];
    expect(doctorsInDepartment(doctors, "ICU")).toEqual([{ department: "ICU" }]);
  });
});
