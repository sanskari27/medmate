import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore, useAppSelector } from "@/app/store";
import { selectHomePath } from "@/features/setup";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import type { InvoiceSettingsView } from "../../model";
import { InvoiceSettingsPage } from "./InvoiceSettingsPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "pharmacy",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: "pharmacy-1",
    pharmacyRole: "owner",
    verificationStatus: "approved",
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const loaded: InvoiceSettingsView = {
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
  logo: { contentType: "image/png", url: "/logo" },
  signature: { contentType: "image/png", url: "/signature" },
  pharmacy: {
    name: "Care Pharmacy",
    address: "12 Market Road, Bengaluru, Karnataka, 560001",
    phone: "+919876543210",
    email: "owner@example.com",
    gstin: "29ABCDE1234F1Z5",
    drugLicenceNo: "DL-1",
    pharmacistName: "Asha Rao",
  },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function Harness() {
  const next = useAppSelector(selectHomePath);
  if (next === "/application-status") return <p>Application in review</p>;
  return <InvoiceSettingsPage />;
}

function asRequest(input: RequestInfo | URL, init?: RequestInit) {
  return input instanceof Request ? input : new Request(input, init);
}

async function readPost(request: Request) {
  const copy = request.clone();
  try {
    const body = await request.formData();
    return {
      hasSignature: body.has("signature"),
      title: String(body.get("title") ?? ""),
    };
  } catch {
    const raw = await copy.text();
    const title = /name="title"[\s\S]*?\r\n\r\n([^\r\n]*)/.exec(raw)?.[1] ?? "";
    return { hasSignature: raw.includes('name="signature"'), title };
  }
}

function renderPage(
  role: Session["account"]["pharmacyRole"] = "owner",
  permissions: string[] = [],
  onSave?: (body: { hasSignature: boolean; title: string }) => {
    status: "approved" | "pending_compliance";
  },
) {
  writeSession({
    ...session,
    account: { ...session.account, pharmacyRole: role, permissions },
  });
  let current = loaded;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = asRequest(input, init);
      if (request.method === "POST" && request.url.includes("/pharmacy/invoice-settings")) {
        const body = await readPost(request);
        const saved = onSave?.(body) ?? { status: "approved" as const };
        current = { ...current, title: body.title || current.title };
        return json({
          ...current,
          status: saved.status,
          rejection: null,
          pinSetupRequired: false,
        });
      }
      if (request.url.includes("/pharmacy/invoice-settings")) return json(current);
      return json({ detail: "Not found" }, 404);
    }),
  );
  return render(
    <Provider store={createAppStore()}>
      <Harness />
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("InvoiceSettingsPage", () => {
  it("shows the three cards and a sample bill without the dropped fields", async () => {
    renderPage();
    expect(await screen.findByText("Invoice template")).toBeTruthy();
    expect(screen.getByText("Classic")).toBeTruthy();
    expect(screen.getByText("Modern")).toBeTruthy();
    expect(screen.getByText("Minimal")).toBeTruthy();
    expect(screen.getByText("Thermal")).toBeTruthy();
    expect(screen.getByText("Accent colour")).toBeTruthy();
    expect(screen.getByText("Branding")).toBeTruthy();
    expect(screen.getByText("Brand logo")).toBeTruthy();
    expect(screen.getByText("Signature / seal stamp")).toBeTruthy();
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByLabelText("Document title")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Live preview" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Care Pharmacy" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "TAX INVOICE" })).toBeTruthy();
    expect(screen.getByText("Paracetamol 500mg")).toBeTruthy();
    expect(screen.getByText("Cetirizine 10mg")).toBeTruthy();
    expect(screen.getByText("Dr. Rao")).toBeTruthy();
    expect(screen.getAllByText(/You saved/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Thank you — get well soon/)).toBeTruthy();
    expect(screen.getByRole("img", { name: "logo" })).toBeTruthy();
    expect(document.querySelector("[data-template='classic']")?.className).toContain("w-[210mm]");
    expect(document.querySelector("[data-template='classic']")?.className).toContain(
      "min-h-[297mm]",
    );
    expect(screen.queryByText("Footer note")).toBeNull();
    expect(screen.queryByText("HSN")).toBeNull();
    expect(screen.queryByText("Show HSN column")).toBeNull();
  });

  it("redraws the title, the thermal roll, and a hidden logo before save", async () => {
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);
    renderPage();
    fireEvent.change(await screen.findByLabelText("Document title"), {
      target: { value: "BILL OF SUPPLY" },
    });
    expect(screen.getByRole("heading", { name: "BILL OF SUPPLY" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Thermal/ }));
    const roll = document.querySelector("[data-template='thermal']");
    expect(roll?.className).toContain("w-[80mm]");
    expect(roll?.className).not.toContain("min-h-[297mm]");
    fireEvent.click(screen.getByRole("button", { name: "Show logo on invoice" }));
    expect(screen.queryByRole("img", { name: "logo" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Print sample" }));
    expect(print).toHaveBeenCalledOnce();
  });

  it("hides save and disables the fields without update", async () => {
    renderPage("staff", ["invoice-settings:read"]);
    const title = (await screen.findByLabelText("Document title")) as HTMLInputElement;
    expect(title.disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  it("confirms a title change and stays on the page", async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText("Document title"), {
      target: { value: "BILL OF SUPPLY" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const dialog = screen.getByRole("dialog", { name: "Save invoice settings?" });
    expect(within(dialog).getByRole("heading", { name: "Save invoice settings?" })).toBeTruthy();
    expect(within(dialog).getByText("Save invoice settings?", { selector: "p" })).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await screen.findByDisplayValue("BILL OF SUPPLY")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByText("Application in review")).toBeNull();
  });

  it("warns when a new signature will leave the console", async () => {
    renderPage("owner", [], (body) => ({
      status: body.hasSignature ? "pending_compliance" : "approved",
    }));
    const input = (await screen.findByLabelText("Signature / seal stamp")) as HTMLInputElement;
    const signature = new File([new Uint8Array([1])], "sign.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [signature] } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    const dialog = screen.getByRole("dialog", { name: "Save invoice settings?" });
    expect(
      within(dialog).getByText(
        "A signature change is sent for review. You will not be able to use the console until the pharmacy is approved again.",
      ),
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Application in review")).toBeTruthy();
  });
});
