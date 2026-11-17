import { describe, expect, it } from "vitest";
import { filterFromParams, filterParams, patientQuery } from "./patientQuery";

describe("patient query", () => {
  it("defaults to the first page", () => {
    expect(patientQuery({})).toEqual({ page: 1, size: 25 });
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

  it("sends the due flag when it is false, so the patients with nothing owed are selected", () => {
    expect(patientQuery({ due: false }).due).toBe("false");
  });

  it("omits the due flag when it is not set", () => {
    expect("due" in patientQuery({})).toBe(false);
  });
});

describe("filter parameters", () => {
  it("builds the parameters a link to the patient list carries", () => {
    expect(filterParams({ status: "waiting" })).toEqual({ status: "waiting" });
    expect(filterParams({ due: true })).toEqual({ due: "true" });
    expect(filterParams({ q: "raj", sort: "last-seen" })).toEqual({ q: "raj", sort: "last-seen" });
  });

  it("leaves the all status and an empty search out of the link", () => {
    expect(filterParams({ status: "all", q: "" })).toEqual({});
  });

  it("reads the filter back from the parameters", () => {
    const params = new URLSearchParams("status=waiting&due=true&q=raj");
    expect(filterFromParams(params)).toEqual({
      q: "raj",
      status: "waiting",
      due: true,
      sort: undefined,
    });
  });

  it("reads an empty link as no filter at all", () => {
    expect(filterFromParams(new URLSearchParams())).toEqual({
      q: undefined,
      status: undefined,
      due: undefined,
      sort: undefined,
    });
  });
});
