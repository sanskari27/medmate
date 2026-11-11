import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Account, Session } from "@/types";
import { SupportPage } from "./SupportPage";

const session: Session = {
  accessToken: "access",
  refreshToken: "refresh",
  expiresIn: 900,
  account: {
    id: "account-id",
    accountType: "admin",
    phone: "+919876543210",
    displayName: "Ada",
    pharmacyId: null,
    pharmacyRole: null,
    verificationStatus: null,
    rejection: null,
    subtypes: [],
    permissions: [],
    pinSetupRequired: false,
  },
};

const faqs = [
  {
    id: "faq-1",
    question: "How do I add a new medicine to inventory?",
    answer: "Go to Inventory.",
    position: 1,
    published: true,
  },
];

const cases = [
  {
    id: "case-1",
    ticketNumber: "TKT-4",
    pharmacyId: "pharmacy-1",
    pharmacyName: "Sri Sai Medicals",
    subject: "GST rate",
    category: "Billing",
    status: "waiting",
    assigneeId: null,
    assigneeName: null,
    createdAt: "2026-11-12T10:00:00Z",
    resolvedAt: null,
  },
];

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

class Socket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(public url: string) {}
  send() {}
  close() {
    this.onclose?.();
  }
}

function renderPage(account: Partial<Account> = {}) {
  writeSession({ ...session, account: { ...session.account, ...account } });
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter>
        <SupportPage />
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("SupportPage", () => {
  it("lets an admin add and hide an FAQ and lists an unassigned case", async () => {
    const listed = [...faqs];
    vi.stubGlobal("WebSocket", Socket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = requestUrl(input);
        if (init?.method === "POST" && url.endsWith("/support/faqs")) {
          const body = JSON.parse(String(init.body)) as { question: string; answer: string };
          listed.push({
            id: "faq-2",
            question: body.question,
            answer: body.answer,
            position: 2,
            published: true,
          });
          return json(listed[listed.length - 1]);
        }
        if (init?.method === "PATCH") {
          listed[0] = { ...listed[0], published: !listed[0].published };
          return json(listed[0]);
        }
        if (url.includes("/support/faqs")) return json(listed);
        if (url.includes("/support/cases")) return json(cases);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    expect(await screen.findByText("How do I add a new medicine to inventory?")).toBeTruthy();
    expect(screen.getByText(/Sri Sai Medicals/)).toBeTruthy();
    expect(screen.getByText("Unassigned")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pick up" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add FAQ" }));
    expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Question"), { target: { value: "Can I export sales?" } });
    fireEvent.change(screen.getByLabelText("Answer"), { target: { value: "Yes, from Reports." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Can I export sales?")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("switch", { name: "Hide How do I add a new medicine to inventory?" }),
    );
    expect(
      await screen.findByRole("switch", { name: "Publish How do I add a new medicine to inventory?" }),
    ).toBeTruthy();
  });

  it("lets support staff edit the same FAQ list", async () => {
    vi.stubGlobal("WebSocket", Socket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        if (url.includes("/support/faqs")) return json(faqs);
        if (url.includes("/support/cases")) return json([]);
        return json({ detail: "Not found" }, 404);
      }),
    );
    renderPage({ accountType: "staff", subtypes: ["support"] });
    expect(await screen.findByRole("button", { name: "Add FAQ" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
    expect(screen.getByText("No cases yet.")).toBeTruthy();
  });
});
