import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Account, Session } from "@/types";
import { SupportCasePage } from "./SupportCasePage";

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

const detail = {
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
  messages: [
    {
      id: "m1",
      authorId: "owner",
      authorName: "Ada",
      body: "One line is wrong.",
      createdAt: "2026-11-12T10:05:00Z",
    },
  ],
};

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
      <MemoryRouter initialEntries={["/support/cases/case-1"]}>
        <Routes>
          <Route path="/support/cases/:caseId" element={<SupportCasePage />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("SupportCasePage", () => {
  it("keeps the transcript read-only for a platform admin", async () => {
    vi.stubGlobal("WebSocket", Socket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json(detail)),
    );
    renderPage();
    expect(await screen.findByText("One line is wrong.")).toBeTruthy();
    expect(screen.getByText(/Unassigned/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pick up" })).toBeNull();
    expect(screen.queryByPlaceholderText("Write a message")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark resolved" })).toBeNull();
  });

  it("lets support staff pick up, reply, and resolve", async () => {
    let status: "waiting" | "open" | "resolved" = "waiting";
    const messages = [...detail.messages];
    vi.stubGlobal("WebSocket", Socket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = requestUrl(input);
        const current = {
          ...detail,
          status,
          assigneeName: status === "waiting" ? null : "Nia",
          messages,
        };
        if (url.endsWith("/claim")) {
          status = "open";
          return json({ ...current, status, assigneeName: "Nia" });
        }
        if (url.endsWith("/resolve")) {
          status = "resolved";
          return json({ ...current, status, assigneeName: "Nia" });
        }
        if (url.endsWith("/messages")) {
          messages.push({
            id: "m2",
            authorId: "account-id",
            authorName: "Nia",
            body: "Looking now",
            createdAt: "2026-11-12T10:06:00Z",
          });
          return json(messages[messages.length - 1]);
        }
        return json(current);
      }),
    );
    renderPage({ accountType: "staff", subtypes: ["support"], displayName: "Nia" });
    fireEvent.click(await screen.findByRole("button", { name: "Pick up" }));
    expect(await screen.findByText(/Nia/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Pick up" })).toBeNull();
    fireEvent.change(screen.getByPlaceholderText("Write a message"), {
      target: { value: "Looking now" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Looking now")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mark resolved" }));
    expect(await screen.findByText(/Resolved/)).toBeTruthy();
    expect(screen.queryByPlaceholderText("Write a message")).toBeNull();
  });
});
