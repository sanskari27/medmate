import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createAppStore } from "@/app/store";
import { writeSession } from "@/services/storage";
import type { Session } from "@/types";
import { ChatPanel } from "./ChatPanel";

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

function caseBody(status: "waiting" | "resolved", messages: { id: string; body: string }[]) {
  return {
    id: "case-1",
    ticketNumber: "TKT-4",
    pharmacyId: "pharmacy-1",
    pharmacyName: "Sri Sai",
    subject: "GST rate",
    category: "Billing",
    status,
    assigneeId: null,
    assigneeName: null,
    createdAt: "2026-11-12T10:00:00Z",
    resolvedAt: status === "resolved" ? "2026-11-12T11:00:00Z" : null,
    messages: messages.map((message) => ({
      ...message,
      authorId: "account-id",
      authorName: "Ada",
      createdAt: "2026-11-12T10:05:00Z",
    })),
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

describe("ChatPanel", () => {
  it("lets the owner send while waiting and hides the composer after resolve", async () => {
    let status: "waiting" | "resolved" = "waiting";
    const messages = [{ id: "m1", body: "One line is wrong." }];
    vi.stubGlobal("WebSocket", Socket);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        const url = requestUrl(input);
        if (url.endsWith("/resolve")) {
          status = "resolved";
          return json(caseBody(status, messages));
        }
        if (url.endsWith("/messages") && init?.method === "POST") {
          messages.push({ id: "m2", body: "Still waiting" });
          return json({
            id: "m2",
            authorId: "account-id",
            authorName: "Ada",
            body: "Still waiting",
            createdAt: "2026-11-12T10:06:00Z",
          });
        }
        if (url.includes("/support/cases/case-1")) return json(caseBody(status, messages));
        return json({ detail: "Not found" }, 404);
      }),
    );
    writeSession(session);
    render(
      <Provider store={createAppStore()}>
        <ChatPanel caseId="case-1" onClose={() => undefined} />
      </Provider>,
    );

    expect(await screen.findByRole("dialog", { name: "GST rate" })).toBeTruthy();
    expect(screen.getByText("Waiting for support")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Write a message"), {
      target: { value: "Still waiting" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("Still waiting")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Mark resolved" }));
    expect(await screen.findByText(/Resolved/)).toBeTruthy();
    expect(screen.queryByPlaceholderText("Write a message")).toBeNull();
    expect(screen.queryByRole("button", { name: "Mark resolved" })).toBeNull();
  });
});
