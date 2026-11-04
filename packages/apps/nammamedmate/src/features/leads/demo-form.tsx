import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { leadPayload, submitLead } from "@/features/leads/api";
import { Honeypot } from "@/features/leads/honeypot";
import { config } from "@/lib/site";

type DemoLead = {
  name: string;
  phone: string;
  pharmacyName: string;
  cityPincode: string;
  preferredTime: string;
  source: string;
  notes: string;
};

const empty: DemoLead = {
  name: "",
  phone: "",
  pharmacyName: "",
  cityPincode: "",
  preferredTime: "",
  source: "ORGANIC",
  notes: "",
};

type DemoFormProps = {
  onSubmitted?: () => void;
  idPrefix?: string;
};

export function DemoForm({ onSubmitted, idPrefix = "demo" }: DemoFormProps) {
  const [lead, setLead] = useState<DemoLead>(empty);
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const payload = { ...lead, source: lead.source || "ORGANIC" };

    try {
      await submitLead(
        leadPayload("demo", {
          name: payload.name,
          phone: payload.phone,
          pharmacyName: payload.pharmacyName,
          cityPincode: payload.cityPincode,
          preferredTime: payload.preferredTime,
          source: payload.source,
          notes: payload.notes,
          companyWebsite,
        }),
      );
      setStatus("sent");
      setLead(empty);
      setCompanyWebsite("");
      onSubmitted?.();
    } catch {
      setStatus("error");
    }
  }

  function field(key: keyof DemoLead, value: string) {
    setLead((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit}
      noValidate
      data-testid="demo-form"
    >
      <Honeypot value={companyWebsite} onChange={setCompanyWebsite} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-name`}>Name</Label>
          <Input
            id={`${idPrefix}-name`}
            required
            value={lead.name}
            onChange={(e) => field("name", e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-phone`}>Phone</Label>
          <Input
            id={`${idPrefix}-phone`}
            required
            type="tel"
            value={lead.phone}
            onChange={(e) => field("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-pharmacy`}>Pharmacy name</Label>
          <Input
            id={`${idPrefix}-pharmacy`}
            required
            value={lead.pharmacyName}
            onChange={(e) => field("pharmacyName", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-city`}>City / pincode</Label>
          <Input
            id={`${idPrefix}-city`}
            required
            value={lead.cityPincode}
            onChange={(e) => field("cityPincode", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-time`}>Preferred time</Label>
          <Input
            id={`${idPrefix}-time`}
            required
            placeholder="e.g. Weekday mornings"
            value={lead.preferredTime}
            onChange={(e) => field("preferredTime", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${idPrefix}-source`}>Source</Label>
          <Select
            value={lead.source}
            onValueChange={(v) => field("source", v ?? "ORGANIC")}
          >
            <SelectTrigger id={`${idPrefix}-source`} className="w-full">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ORGANIC">Organic</SelectItem>
              <SelectItem value="AD">Ad</SelectItem>
              <SelectItem value="REFERRAL">Referral</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${idPrefix}-notes`}>Notes (optional)</Label>
        <Textarea
          id={`${idPrefix}-notes`}
          rows={3}
          value={lead.notes}
          onChange={(e) => field("notes", e.target.value)}
        />
      </div>
      {status === "sent" ? (
        <p className="text-sm text-primary" role="status">
          Thanks — your demo request was sent. We will reach out soon.
        </p>
      ) : null}
      {status === "error" ? (
        <p className="text-sm text-destructive" role="alert">
          Something went wrong. Try again or email {config.supportEmail}.
        </p>
      ) : null}
      <Button type="submit" size="lg" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Book a free demo"}
      </Button>
    </form>
  );
}
