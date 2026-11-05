import { useState, type ChangeEvent } from "react";
import { fmtDateTime, inr } from "@/utils";
import { attributedSales, SEGMENTS, segLabel, type Campaign, type Segment } from "@/utils/calculations/crm";
import { Box, Button, Input, Select, Stack, Text, Textarea } from "@/components/atoms";
import { IconDot, IconMail, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody, CardHeader } from "@/components/molecules/Card";
import { EmptyState } from "@/components/molecules/EmptyState";
import { Field } from "@/components/molecules/Field";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { campaignMessage, campaignRecipients, openSms, openWhatsApp } from "@/screens/Crm/Crm.utils";

import type { CampaignsProps } from "./Campaigns.types";
export function Campaigns({ view }: CampaignsProps) {
  const [segment, setSegment] = useState<Segment | "all">("chronic");
  const [channel, setChannel] = useState<"whatsapp" | "sms">("whatsapp");
  const [offer, setOffer] = useState("");
  const [message, setMessage] = useState("");
  const recipients = campaignRecipients(view.patients, segment);
  const text = campaignMessage(view.profile.name, offer, message);

  function handleSegment(event: ChangeEvent<HTMLSelectElement>) {
    setSegment(event.target.value as Segment | "all");
  }
  function handleOffer(event: ChangeEvent<HTMLInputElement>) {
    setOffer(event.target.value);
  }
  function handleMessage(event: ChangeEvent<HTMLTextAreaElement>) {
    setMessage(event.target.value);
  }
  function chooseWhatsApp() {
    setChannel("whatsapp");
  }
  function chooseSms() {
    setChannel("sms");
  }
  async function launch() {
    if (recipients.length === 0) return;
    const error = await view.addCampaign({
      name: `${segLabel(segment as Segment) || "All"} blast`,
      segment,
      channel,
      message: text,
      offerLabel: offer || undefined,
      reach: recipients.length,
    });
    const first = recipients[0];
    if (!error && first?.phone) {
      const greeting = text.replace("Hi!", `Hi ${first.name}!`);
      if (channel === "whatsapp") openWhatsApp(first.phone, greeting);
      else openSms(first.phone, greeting);
    }
  }

  return (
    <Box className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader title="New campaign" subtitle={`${recipients.length} recipients`} />
        <CardBody>
          <Stack gap={3}>
            <Field label="Target segment" htmlFor="campaign-segment">
              <Select id="campaign-segment" value={segment} onChange={handleSegment} options={[{ value: "all", label: "Everyone with phone" }, ...SegmentOptions()]} />
            </Field>
            <Field label="Channel">
              <SegmentedControl label="Campaign channel">
                <Button size="sm" variant="ghost" className={channel === "whatsapp" ? "border-transparent bg-paper text-dark shadow-sm" : "border-transparent bg-transparent text-muted shadow-none"} onClick={chooseWhatsApp}>WhatsApp</Button>
                <Button size="sm" variant="ghost" className={channel === "sms" ? "border-transparent bg-paper text-dark shadow-sm" : "border-transparent bg-transparent text-muted shadow-none"} onClick={chooseSms}>SMS</Button>
              </SegmentedControl>
            </Field>
            <Field label="Offer (optional)" htmlFor="campaign-offer">
              <Input id="campaign-offer" value={offer} onChange={handleOffer} placeholder="e.g. 10% off all diabetes meds" />
            </Field>
            <Field label="Message" htmlFor="campaign-message">
              <Textarea id="campaign-message" rows={4} value={text} onChange={handleMessage} />
            </Field>
            <Button block disabled={recipients.length === 0} onClick={launch}>
              <IconWhatsApp size={16} /> Send to {recipients.length} {channel === "whatsapp" ? "on WhatsApp" : "via SMS"}
            </Button>
            <Text variant="caption">ⓘ Opens the first recipient prefilled for you to send, and logs the campaign reach. Bulk send needs a WhatsApp Business API (can be wired later).</Text>
          </Stack>
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Campaign history" subtitle={`${view.crm.campaigns.length} sent`} />
        <CardBody>
          {view.crm.campaigns.length === 0 ? <EmptyState title="No campaigns yet." className="py-4" /> : <CampaignRows campaigns={view.crm.campaigns} view={view} />}
        </CardBody>
      </Card>
    </Box>
  );
}

function SegmentOptions() {
  return SEGMENTS.map(function renderOption(segment) {
    return { value: String(segment.key), label: String(segment.label) };
  });
}

function CampaignRows({ campaigns, view }: { campaigns: Campaign[]; view: CrmViewProps }) {
  return campaigns.map(function renderCampaign(campaign) {
    const revenue = attributedSales(campaign, view.patients, view.sales);
    return (
      <Stack key={campaign.id} direction="row" align="center" gap={2} className="border-b border-line py-2 last:border-0">
        <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid">
          {campaign.channel === "whatsapp" ? <Box className="text-green"><IconDot size={8} /></Box> : <IconMail size={15} />}
        </Box>
        <Stack className="min-w-0 flex-1">
          <Text className="font-bold">{campaign.name} · {campaign.reach} sent</Text>
          <Text variant="caption">{segLabel(campaign.segment as Segment) || "All"}{campaign.offerLabel ? " · " + campaign.offerLabel : ""} · {fmtDateTime(campaign.sentAt)}</Text>
        </Stack>
        <Stack align="end">
          <Text className="font-bold text-green">{inr(revenue)}</Text>
          <Text variant="caption">attributed</Text>
        </Stack>
      </Stack>
    );
  });
}
