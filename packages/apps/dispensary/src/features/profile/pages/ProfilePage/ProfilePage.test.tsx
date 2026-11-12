import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore, useAppSelector } from "@/app/store";
import { selectHomePath } from "@/features/setup";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import type { ProfileApplication } from "../../model";
import { ProfilePage } from "./ProfilePage";

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

const loaded: ProfileApplication = {
  name: "Sri Sai Medicals",
  tagline: "Open late",
  email: "owner@example.com",
  address: "12 Market Road",
  city: "Bengaluru",
  state: "Karnataka",
  pincode: "560001",
  businessTypes: ["Retail Pharmacy"],
  industry: "Pharmacy & Healthcare",
  registrationType: "Proprietorship",
  pharmacyType: "pharmacy",
  gstin: "29ABCDE1234F1Z5",
  pan: "ABCDE1234F",
  drugLicenceNo: "DL-1",
  fssaiNo: "FSSAI-1",
  tradeLicenceNo: "TL-1",
  enableTds: false,
  enableTcs: false,
  eInvoicing: false,
  pharmacistName: "Asha Rao",
  terms: "Goods once sold",
  extraDetails: [],
  documents: [
    { slot: "gst", contentType: "application/pdf", url: "/gst" },
    { slot: "signature", contentType: "image/png", url: "/signature" },
  ],
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
  return <ProfilePage />;
}

function asRequest(input: RequestInfo | URL, init?: RequestInit) {
  return input instanceof Request ? input : new Request(input, init);
}

function renderPage(onSave?: (body: FormData) => { status: "approved" | "pending_compliance" }) {
  writeSession(session);
  let current = loaded;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const request = asRequest(input, init);
      if (request.method === "POST" && request.url.includes("/pharmacy/profile")) {
        const body = await request.formData();
        const saved = onSave?.(body) ?? { status: "approved" as const };
        current = {
          ...current,
          tagline: String(body.get("tagline") ?? current.tagline),
          gstin: String(body.get("gstin") ?? current.gstin),
        };
        return json({
          pharmacyId: "pharmacy-1",
          status: saved.status,
          rejection: null,
          pinSetupRequired: false,
        });
      }
      if (request.url.includes("/pharmacy/application")) return json(current);
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

describe("ProfilePage", () => {
  it("keeps the phone read-only and omits the store, distributor, and wizard blocks", async () => {
    renderPage();
    const phone = (await screen.findByLabelText("Company Phone Number")) as HTMLInputElement;
    expect(phone.value).toBe("+919876543210");
    expect(phone.readOnly).toBe(true);
    expect(screen.getByText("Login uses this number, so it cannot be changed.")).toBeTruthy();
    const pharmacyType = screen.getByLabelText("Pharmacy type") as HTMLSelectElement;
    expect(pharmacyType.disabled).toBe(true);
    expect(pharmacyType.value).toBe("pharmacy");
    expect(screen.getByText("Set during setup, so it cannot be changed.")).toBeTruthy();
    expect(screen.queryByText("Online store")).toBeNull();
    expect(screen.queryByText("Distributors")).toBeNull();
    expect(screen.queryByText("Store setup wizard")).toBeNull();
    expect(
      (screen.getByRole("button", { name: "Save changes" }) as HTMLButtonElement).disabled,
    ).toBe(true);
  });

  it("confirms a safe save and stays on the page", async () => {
    renderPage();
    fireEvent.change(await screen.findByLabelText("Tagline"), { target: { value: "Open early" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const dialog = screen.getByRole("dialog", { name: "Save changes?" });
    expect(within(dialog).getByText("Your pharmacy details will be saved.")).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await screen.findByDisplayValue("Open early")).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByText("Unsaved changes")).toBeNull();
    });
    expect(screen.queryByText("Application in review")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("warns when a GSTIN change will leave the console", async () => {
    renderPage((body) => ({
      status: body.get("gstin") === "29ABCDE1234F2Z5" ? "pending_compliance" : "approved",
    }));
    fireEvent.change(await screen.findByLabelText("GSTIN *"), {
      target: { value: "29ABCDE1234F2Z5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const dialog = screen.getByRole("dialog", { name: "Save changes?" });
    expect(
      within(dialog).getByText(
        "Licence, pharmacist, or signature changes are sent for review. You will not be able to use the console until the pharmacy is approved again.",
      ),
    ).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Application in review")).toBeTruthy();
  });
});
