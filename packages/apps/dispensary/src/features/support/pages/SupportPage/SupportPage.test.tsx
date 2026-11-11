import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { SupportPage } from "./SupportPage";

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

const faqs = [
  {
    id: "faq-1",
    question: "How do I add a new medicine to inventory?",
    answer: "Go to Inventory.",
    position: 1,
    published: true,
  },
  {
    id: "faq-2",
    question: "How is GST calculated on my invoices?",
    answer: "Selling prices are GST-inclusive.",
    position: 2,
    published: true,
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
  static sockets: Socket[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(public url: string) {
    Socket.sockets.push(this);
  }
  send() {}
  close() {
    this.onclose?.();
  }
}

function renderPage() {
  writeSession(session);
  return render(
    <Provider store={createAppStore()}>
      <MemoryRouter initialEntries={["/support"]}>
        <Routes>
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/:caseId" element={<SupportPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  Socket.sockets = [];
});

describe("SupportPage", () => {
  it("lists FAQs, the email link, and an empty ticket list", async () => {
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

    renderPage();
    expect(await screen.findByText("How do I add a new medicine to inventory?")).toBeTruthy();
    expect(screen.getByText("Go to Inventory.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /How is GST calculated on my invoices/ }));
    expect(screen.getByText("Selling prices are GST-inclusive.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Email" }).getAttribute("href")).toBe(
      "mailto:support@nammamedmate.com",
    );
    expect(screen.getByText("support@nammamedmate.com")).toBeTruthy();
    expect(screen.getByText("No tickets yet.")).toBeTruthy();
    expect(screen.queryByText("Help centre")).toBeNull();
    expect(screen.queryByText(/1800/)).toBeNull();
  });

  it("requires a subject before opening a ticket or a chat", async () => {
    vi.stubGlobal("WebSocket", Socket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = requestUrl(input);
        const method = init?.method ?? (input instanceof Request ? input.method : "GET");
        const raw = init?.body ?? (input instanceof Request ? await input.clone().text() : "");
        if (url.includes("/support/faqs")) return json(faqs);
        if (method === "POST" && url.endsWith("/support/cases")) {
          const body = JSON.parse(String(raw)) as { subject: string; kind: string };
          return json({
            id: "case-1",
            ticketNumber: "TKT-1",
            pharmacyId: "pharmacy-1",
            pharmacyName: "Sri Sai",
            subject: body.subject,
            category: body.kind === "chat" ? "Live chat" : "Billing",
            status: "waiting",
            assigneeId: null,
            assigneeName: null,
            createdAt: "2026-11-12T10:00:00Z",
            resolvedAt: null,
            messages: [],
          });
        }
        if (url.includes("/support/cases/case-1")) {
          return json({
            id: "case-1",
            ticketNumber: "TKT-1",
            pharmacyId: "pharmacy-1",
            pharmacyName: "Sri Sai",
            subject: "GST rate",
            category: "Billing",
            status: "waiting",
            assigneeId: null,
            assigneeName: null,
            createdAt: "2026-11-12T10:00:00Z",
            resolvedAt: null,
            messages: [],
          });
        }
        if (url.endsWith("/support/cases")) return json([]);
        return json({ detail: "Not found" }, 404);
      }),
    );

    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Raise ticket" }));
    expect(screen.getByRole("dialog", { name: "Raise a support ticket" })).toBeTruthy();
    expect(screen.getByLabelText("Category")).toBeTruthy();
    expect(screen.getByLabelText("Details")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Submit ticket" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.change(screen.getByPlaceholderText("Briefly describe the issue"), {
      target: { value: "GST rate" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit ticket" }));
    expect(await screen.findByRole("dialog", { name: "GST rate" })).toBeTruthy();
    expect(screen.getByPlaceholderText("Write a message")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Frequently asked" })).toBeTruthy();
  });
});
