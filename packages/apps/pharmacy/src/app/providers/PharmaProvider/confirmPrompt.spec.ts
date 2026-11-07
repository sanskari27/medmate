import { describe, expect, it } from "vitest";
import { confirmPrompt, resolveConfirm } from "./confirmPrompt";

describe("confirmPrompt", () => {
  it("describes a paid invoice as a save", () => {
    expect(confirmPrompt("billing/checkoutPos")).toMatchObject({
      title: "Create this invoice?",
      tone: "positive",
      confirm: "Create invoice",
    });
  });

  it("describes an unpaid bill as a caution", () => {
    expect(confirmPrompt("billing/checkoutPos", { paid: false })).toMatchObject({
      title: "Send this bill unpaid?",
      tone: "caution",
      confirm: "Send unpaid",
    });
  });

  it("colors destructive actions differently from edits", () => {
    expect(confirmPrompt("sales/cancelOrder").tone).toBe("danger");
    expect(confirmPrompt("hospital/dischargePatient").tone).toBe("danger");
    expect(confirmPrompt("prescriptions/reject", { id: "rx1", reason: "unclear" }).tone).toBe(
      "danger",
    );
    expect(confirmPrompt("hospital/updateDoctor").tone).toBe("caution");
    expect(confirmPrompt("auth/shareWithCA").tone).toBe("info");
  });

  it("follows the status on an indent", () => {
    expect(
      confirmPrompt("hospital/setIndentStatus", { id: "1", status: "approved" }),
    ).toMatchObject({ title: "Approve this indent?", tone: "positive" });
    expect(
      confirmPrompt("hospital/setIndentStatus", { id: "1", status: "rejected" }),
    ).toMatchObject({ title: "Reject this indent?", tone: "danger" });
  });

  it("names the hospital field being changed", () => {
    expect(
      confirmPrompt("hospital/updateHospitalAccount", { gstin: "27AAAAA0000A1Z5" }),
    ).toMatchObject({ title: "Update the hospital GSTIN?", tone: "caution" });
    expect(confirmPrompt("hospital/updateWard", { id: "w1", patch: { beds: 12 } })).toMatchObject({
      title: "Change the bed count?",
    });
  });

  it("lets a caller replace the words without losing the color", () => {
    expect(
      resolveConfirm("auth/commitSetup", undefined, {
        copy: { title: "Finish setup?", body: "Your pharmacy details will be saved." },
      }),
    ).toMatchObject({
      title: "Finish setup?",
      body: "Your pharmacy details will be saved.",
      tone: "positive",
      confirm: "Finish setup",
    });
  });

  it("still has a colored fallback for an unknown action", () => {
    expect(confirmPrompt("sales/cancelMystery")).toMatchObject({
      tone: "danger",
      confirm: "Cancel",
    });
  });
});
