import { useState, type FormEvent } from "react";
import { contactSubjects } from "@/content/pages/contact";
import { leadPayload, submitLead } from "@/features/leads/api";
import { Honeypot } from "@/features/leads/honeypot";
import { config } from "@/lib/site";

type SubmissionStatus = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    try {
      await submitLead(
        leadPayload("contact", {
          name,
          email,
          subject,
          message,
          source: "CONTACT",
          notes: message.trim(),
          companyWebsite,
        }),
      );
      setStatus("sent");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
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
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            required
            placeholder="Your name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="nl-field">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            required
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="nl-field">
          <label htmlFor="contact-subject">Subject</label>
          <select
            id="contact-subject"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          >
            <option value="">Choose a topic</option>
            {contactSubjects.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
        <div className="nl-field">
          <label htmlFor="contact-message">Message</label>
          <textarea
            id="contact-message"
            required
            rows={4}
            placeholder="How can we help?"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
        </div>
        {status === "sent" ? (
          <p className="nl-form-status" role="status">
            Thanks — your message was sent. We&apos;ll get back within 1
            business day.
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
          {status === "sending" ? "Sending…" : "Send message"}
        </button>
        <a
          className="nl-form-wa"
          href="https://wa.me/919999999999?text=I%20want%20a%20free%20Namma%20MedMate%20demo"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span aria-hidden>◔</span> Or message us on WhatsApp
        </a>
      </form>
    </div>
  );
}
