import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { Provider } from "react-redux";
import { createAppStore } from "@/app/store";
import { LoginPage } from "./pages/LoginPage";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const session = { accessToken: "access-token", refreshToken: "refresh-token" };

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function renderLogin(fetchImpl: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const store = createAppStore();
  vi.stubGlobal("fetch", fetchImpl as unknown as typeof fetch);
  const { container } = render(<Provider store={store}><LoginPage /></Provider>);
  return { store, container, queries: within(container) };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("DoctorAuth", () => {
  it("never calls the API for a phone that is not a valid Indian mobile", async () => {
    const fetch = vi.fn(async () => json({}));
    const { store, queries, container } = renderLogin(fetch);

    fireEvent.change(queries.getByLabelText("Mobile number"), {
      target: { value: "123" },
    });
    fireEvent.submit(container.querySelector("form")!);

    expect(fetch).not.toHaveBeenCalled();
    expect(store.getState().auth.step).toBe("phone");
  });

  it("sending an OTP moves the step to otp", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.includes("/sms-mock")) return json([]);
      return json({});
    });
    const { store, queries, container } = renderLogin(fetch);

    fireEvent.change(queries.getByLabelText("Mobile number"), {
      target: { value: "9845012345" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(store.getState().auth.step).toBe("otp"));
    expect(fetch).toHaveBeenCalled();
    expect(queries.getByLabelText("6-digit OTP")).toBeInTheDocument();
  });

  it("verifying the OTP moves the step to pin", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.includes("/sms-mock")) return json([]);
      if (url.includes("/auth/otp/send")) return json({});
      if (url.includes("/auth/otp/verify")) return json(session);
      return json({});
    });
    const { store, queries, container } = renderLogin(fetch);

    fireEvent.change(queries.getByLabelText("Mobile number"), {
      target: { value: "9845012345" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(store.getState().auth.step).toBe("otp"));

    fireEvent.change(queries.getByLabelText("6-digit OTP"), {
      target: { value: "000000" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(store.getState().auth.step).toBe("pin"));
    expect(store.getState().auth.session).toEqual(session);
    expect(queries.getByLabelText("4-digit PIN")).toBeInTheDocument();
  });

  it("an account reporting pinSetupRequired moves the step to pin-setup", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.includes("/sms-mock")) return json([]);
      if (url.includes("/auth/otp/send")) return json({});
      if (url.includes("/auth/otp/verify"))
        return json({ ...session, account: { pinSetupRequired: true } });
      return json({});
    });
    const { store, queries, container } = renderLogin(fetch);

    fireEvent.change(queries.getByLabelText("Mobile number"), {
      target: { value: "9845012345" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(store.getState().auth.step).toBe("otp"));

    fireEvent.change(queries.getByLabelText("6-digit OTP"), {
      target: { value: "000000" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(store.getState().auth.step).toBe("pin-setup"));
    expect(queries.getByText(/Create your login PIN/i)).toBeInTheDocument();
    expect(queries.getByLabelText("Confirm PIN")).toBeInTheDocument();
  });

  it("a successful PIN sign-in stores the session and lands on the home screen", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.includes("/sms-mock")) return json([]);
      if (url.includes("/auth/otp/send")) return json({});
      if (url.includes("/auth/otp/verify")) return json(session);
      if (url.includes("/auth/pin")) return json(session);
      return json({});
    });
    const { store, queries, container } = renderLogin(fetch);

    fireEvent.change(queries.getByLabelText("Mobile number"), {
      target: { value: "9845012345" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(store.getState().auth.step).toBe("otp"));

    fireEvent.change(queries.getByLabelText("6-digit OTP"), {
      target: { value: "000000" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(store.getState().auth.step).toBe("pin"));

    fireEvent.change(queries.getByLabelText("4-digit PIN"), {
      target: { value: "1234" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(store.getState().auth.session).toEqual(session));
    await waitFor(() => expect(queries.getByText(/Home/i)).toBeInTheDocument());
  });

  it("shows the OTP code from the mock in development", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      if (url.includes("/sms-mock"))
        return json([{ phone: "+919845012345", code: "123456" }]);
      if (url.includes("/auth/otp/send")) return json({});
      return json({});
    });
    const { queries, container } = renderLogin(fetch);

    fireEvent.change(queries.getByLabelText("Mobile number"), {
      target: { value: "9845012345" },
    });
    fireEvent.submit(container.querySelector("form")!);
    await waitFor(() => expect(queries.getByLabelText("6-digit OTP")).toBeInTheDocument());

    await waitFor(() => expect(queries.getByText(/Demo OTP/i)).toBeInTheDocument());
    await waitFor(() => expect(queries.getByText(/123456/i)).toBeInTheDocument());
  });

  it("does not render the OTP box in a production build", async () => {
    const original = (import.meta.env as Record<string, unknown>).DEV;
    (import.meta.env as Record<string, unknown>).DEV = false;
    try {
      const fetch = vi.fn(async (input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.includes("/sms-mock"))
          return json([{ phone: "+919845012345", code: "123456" }]);
        if (url.includes("/auth/otp/send")) return json({});
        return json({});
      });
      const { container, queries } = renderLogin(fetch);

      fireEvent.change(queries.getByLabelText("Mobile number"), {
        target: { value: "9845012345" },
      });
      fireEvent.submit(container.querySelector("form")!);
      await waitFor(() => expect(queries.getByLabelText("6-digit OTP")).toBeInTheDocument());

      expect(queries.queryByText(/Demo OTP/i)).not.toBeInTheDocument();
    } finally {
      (import.meta.env as Record<string, unknown>).DEV = original;
    }
  });
});