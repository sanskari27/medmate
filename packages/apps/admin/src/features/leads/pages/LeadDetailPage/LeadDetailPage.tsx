import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { useLeadDetailQuery, useMarkLeadMutation } from "../../leads.api";
import {
  fieldValue,
  formLabel,
  formatWhen,
  siteLabel,
  statusLabel,
  type Lead,
  type LeadStatus,
} from "../../model";
import { problemMessage } from "../../problemMessage";

function fields(lead: Lead): [string, string][] {
  return [
    ["Site", siteLabel(lead.site)],
    ["Form", formLabel(lead.type)],
    ["Status", statusLabel(lead.status)],
    ["Received", formatWhen(lead.createdAt)],
    ["Name", fieldValue(lead.name)],
    ["Phone", fieldValue(lead.phone)],
    ["Email", fieldValue(lead.email)],
    ["Pharmacy", fieldValue(lead.pharmacyName)],
    ["City or pincode", fieldValue(lead.cityPincode)],
    ["Area", fieldValue(lead.area)],
    ["City", fieldValue(lead.city)],
    ["Preferred time", fieldValue(lead.preferredTime)],
    ["Monthly sales", fieldValue(lead.monthlySales)],
    ["Subject", fieldValue(lead.subject)],
    ["Message", fieldValue(lead.message)],
    ["Source", fieldValue(lead.source)],
    ["Notes", fieldValue(lead.notes)],
    ["Plan", fieldValue(lead.plan)],
    ["Consent", fieldValue(lead.consent)],
  ];
}

export function LeadDetailPage() {
  const { leadId = "" } = useParams();
  const detail = useLeadDetailQuery(leadId, { skip: leadId.length === 0 });
  const [mark, pending] = useMarkLeadMutation();
  const [failure, setFailure] = useState<string | null>(null);
  const lead = detail.data?.lead;

  async function setStatus(status: LeadStatus) {
    if (!lead) return;
    setFailure(null);
    try {
      await mark({ id: lead.id, status }).unwrap();
    } catch (error) {
      setFailure(problemMessage(error, "Could not update this lead"));
    }
  }

  if (detail.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading lead</Text>;
  }
  if (detail.isError || !lead) {
    return (
      <Text className="text-[13.5px] font-bold text-rose">
        {problemMessage(detail.error, "Could not open this lead")}
      </Text>
    );
  }

  return (
    <Stack className="gap-4">
      <Stack className="gap-2">
        <Button variant="link" asChild className="w-fit text-[13px]">
          <Link to="/leads">All leads</Link>
        </Button>
        <Heading level={2} className="text-[24px]">
          {lead.name}
        </Heading>
      </Stack>
      <div className="grid gap-3 rounded-lg border border-line bg-paper px-4 py-4 sm:grid-cols-2">
        {fields(lead).map(([label, value]) => (
          <div key={label} className={label === "Message" || label === "Notes" ? "sm:col-span-2" : ""}>
            <Text as="span" variant="muted" className="block">
              {label}
            </Text>
            <Text className="mt-0.5 whitespace-pre-wrap text-[14px] text-dark">{value}</Text>
          </div>
        ))}
      </div>
      <Stack direction="row" className="flex-wrap gap-2">
        <Button
          type="button"
          variant={lead.status === "new" ? "primary" : "line"}
          aria-pressed={lead.status === "new"}
          disabled={pending.isLoading}
          onClick={() => void setStatus("new")}
        >
          New
        </Button>
        <Button
          type="button"
          variant={lead.status === "contacted" ? "primary" : "line"}
          aria-pressed={lead.status === "contacted"}
          disabled={pending.isLoading}
          onClick={() => void setStatus("contacted")}
        >
          Contacted
        </Button>
      </Stack>
      {failure ? <Text className="text-[13.5px] font-bold text-rose">{failure}</Text> : null}
    </Stack>
  );
}
