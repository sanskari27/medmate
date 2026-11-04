import { useState, type FormEvent } from "react";
import { pharmacyOwnerDemo } from "@/content/pages/pharmacy-owner";
import { leadPayload, submitLead } from "@/features/leads/api";
import { Honeypot } from "@/features/leads/honeypot";
import { config } from "@/lib/site";

type SubmissionStatus = "idle" | "sending" | "sent" | "error";

export function EarlyAccessForm() {
  const [name, setName] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [phone, setPhone] = useState("");
  const [pincode, setPincode] = useState("");
  const [monthlySales, setMonthlySales] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const { fields: labels } = pharmacyOwnerDemo;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      await submitLead(
        leadPayload("early-access", {
          name,
          phone,
          pharmacyName,
          cityPincode: pincode,
          preferredTime: "Early access",
          source: "ORGANIC",
          monthlySales,
          notes: "Early access · pharmacy-owner page",
          companyWebsite,
        }),
      );
      setStatus("sent");
      setName("");
      setPharmacyName("");
      setPhone("");
      setPincode("");
      setMonthlySales("");
      setCompanyWebsite("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="nl-form-card">
      <form onSubmit={submit}>
        <Honeypot value={companyWebsite} onChange={setCompanyWebsite} />
        <div className="nl-field">
          <label htmlFor="ea-name">{labels.name.label}</label>
          <input
            id="ea-name"
            required
            placeholder={labels.name.placeholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="nl-field">
          <label htmlFor="ea-pharmacy">{labels.pharmacy.label}</label>
          <input
            id="ea-pharmacy"
            required
            placeholder={labels.pharmacy.placeholder}
            value={pharmacyName}
            onChange={(event) => setPharmacyName(event.target.value)}
          />
        </div>
        <div className="nl-form-row">
          <div className="nl-field">
            <label htmlFor="ea-phone">{labels.phone.label}</label>
            <input
              id="ea-phone"
              required
              type="tel"
              placeholder={labels.phone.placeholder}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="nl-field">
            <label htmlFor="ea-pincode">{labels.pincode.label}</label>
            <input
              id="ea-pincode"
              required
              placeholder={labels.pincode.placeholder}
              value={pincode}
              onChange={(event) => setPincode(event.target.value)}
              autoComplete="postal-code"
            />
          </div>
        </div>
        <div className="nl-field">
          <label htmlFor="ea-sales">{labels.sales.label}</label>
          <select
            id="ea-sales"
            required
            value={monthlySales}
            onChange={(event) => setMonthlySales(event.target.value)}
          >
            <option value="">{labels.sales.placeholder}</option>
            {pharmacyOwnerDemo.salesRanges.map((range) => (
              <option key={range} value={range}>
                {range}
              </option>
            ))}
          </select>
        </div>
        {status === "sent" ? (
          <p className="nl-form-status" role="status">
            {pharmacyOwnerDemo.success}
          </p>
        ) : null}
        {status === "error" ? (
          <p className="nl-form-status is-error" role="alert">
            Something went wrong. Try again or email {config.supportEmail}.
          </p>
        ) : null}
        <button
          className="nl-btn nl-btn-primary"
          type="submit"
          style={{ width: "100%" }}
          disabled={status === "sending"}
        >
          {status === "sending"
            ? pharmacyOwnerDemo.sending
            : pharmacyOwnerDemo.submit}
        </button>
      </form>
    </div>
  );
}
