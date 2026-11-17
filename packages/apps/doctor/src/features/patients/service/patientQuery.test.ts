import { describe, expect, it } from "vitest";
import { patientQuery } from "./patientQuery";

describe("patient query", () => {
  it("defaults to the first page sorted by name", () => {
    expect(patientQuery({})).toEqual({ page: 1, size: 25, sort: "name" });
  });

  it("sends the search text, trimmed", () => {
    expect(patientQuery({ q: "  ravi " }).q).toBe("ravi");
  });

  it("omits an empty search and the all status rather than sending them", () => {
    const query = patientQuery({ q: "   ", status: "all" });
    expect("q" in query).toBe(false);
    expect("status" in query).toBe(false);
  });

  it("sends a real status and the due flag", () => {
    const query = patientQuery({ status: "waiting", due: true });
    expect(query.status).toBe("waiting");
    expect(query.due).toBe("true");
  });

  it("omits the due flag when it is not set", () => {
    expect("due" in patientQuery({ due: false })).toBe(false);
  });
});
