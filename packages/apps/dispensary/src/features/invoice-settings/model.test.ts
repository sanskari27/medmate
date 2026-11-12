import { describe, expect, it } from "vitest";
import {
  canOpenInvoiceSettings,
  draftFromSettings,
  isDirty,
  signatureChanged,
  toFormData,
  type InvoicePrintSettings,
} from "./model";

const settings: InvoicePrintSettings = {
  template: "classic",
  accent: "#1B3D29",
  title: "TAX INVOICE",
  prefix: "CARE",
  signatory: "Authorised signatory",
  bankLine: "",
  showBank: false,
  terms: "Goods once sold",
  showLogo: true,
  showStamp: false,
  logo: null,
  signature: { contentType: "image/png", url: "/signature" },
};

describe("invoice settings model", () => {
  it("treats a title edit as dirty and a signature file as a review", () => {
    const baseline = draftFromSettings(settings);
    expect(isDirty(baseline, baseline)).toBe(false);
    expect(isDirty(baseline, { ...baseline, title: "INVOICE" })).toBe(true);
    expect(signatureChanged(baseline)).toBe(false);
    const signature = new File([new Uint8Array([1])], "sign.png", { type: "image/png" });
    expect(signatureChanged({ ...baseline, signatureFile: signature })).toBe(true);
    expect(isDirty(baseline, { ...baseline, signatureFile: signature })).toBe(true);
  });

  it("writes the print fields and files into the multipart body", () => {
    const signature = new File([new Uint8Array([1])], "sign.png", { type: "image/png" });
    const body = toFormData({
      ...draftFromSettings(settings),
      title: "INVOICE",
      signatureFile: signature,
    });
    expect(body.get("template")).toBe("classic");
    expect(body.get("accent")).toBe("#1B3D29");
    expect(body.get("title")).toBe("INVOICE");
    expect(body.get("prefix")).toBe("CARE");
    expect(body.get("signatory")).toBe("Authorised signatory");
    expect(body.get("bankLine")).toBe("");
    expect(body.get("showBank")).toBe("false");
    expect(body.get("terms")).toBe("Goods once sold");
    expect(body.get("showLogo")).toBe("true");
    expect(body.get("showStamp")).toBe("false");
    expect(body.get("signature")).toBe(signature);
    expect(body.has("logo")).toBe(false);
    expect(body.has("footerNote")).toBe(false);
  });

  it("opens for an owner and for staff who can read", () => {
    expect(canOpenInvoiceSettings("owner", [])).toBe(true);
    expect(canOpenInvoiceSettings("staff", ["invoice-settings:read"])).toBe(true);
    expect(canOpenInvoiceSettings("staff", ["invoice-settings:update"])).toBe(false);
  });
});
