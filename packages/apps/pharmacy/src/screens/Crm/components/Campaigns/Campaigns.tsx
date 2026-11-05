import { useState, type ChangeEvent } from "react";
import { fmtDateTime, inr } from "@/utils";
import {
  attributedSales,
  SEGMENTS,
  segLabel,
  type Campaign,
  type Segment,
} from "@/utils/calculations/crm";
import { Box, Button, Heading, Input, Select, Stack, Text, Textarea } from "@/components/atoms";
import { IconDot, IconMail, IconWhatsApp } from "@/components/atoms";
import { Card, CardBody } from "@/components/molecules/Card";
import { Field } from "@/components/molecules/Field";
import { SegmentedControl } from "@/components/molecules/SegmentedControl";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import {
  campaignMessage,
  campaignRecipients,
  openSms,
  openWhatsApp,
} from "@/screens/Crm/Crm.utils";

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
    <Box className="grid grid-cols-1 gap-4 min-[768px]:grid-cols-[1.5fr_1fr]">
      <Card className="!rounded-md !shadow-sm">
        <Stack
          direction="row"
          align="center"
          justify="between"
          wrap
          className="gap-2.5 border-b border-line px-[18px] py-[15px]"
        >
          <Heading level={3} className="!text-[15px] !font-bold !tracking-normal">
            New campaign
          </Heading>
          <Text className="!text-[12.5px] !text-muted">{recipients.length} recipients</Text>
        </Stack>
        <CardBody className="!p-[18px]">
          <Stack gap={3}>
            <Field label="Target segment" htmlFor="campaign-segment">
              <Select
                id="campaign-segment"
                value={segment}
                onChange={handleSegment}
                options={[{ value: "all", label: "Everyone with phone" }, ...SegmentOptions()]}
              />
            </Field>
            <Field label="Channel">
              <SegmentedControl
                label="Campaign channel"
                className="!w-fit !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5"
              >
                <Button
                  size="sm"
                  variant="ghost"
                  className={
                    channel === "whatsapp"
                      ? "!rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper"
                      : "!rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent"
                  }
                  onClick={chooseWhatsApp}
                >
                  WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className={
                    channel === "sms"
                      ? "!rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper"
                      : "!rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent"
                  }
                  onClick={chooseSms}
                >
                  SMS
                </Button>
              </SegmentedControl>
            </Field>
            <Field label="Offer (optional)" htmlFor="campaign-offer">
              <Input
                id="campaign-offer"
                value={offer}
                onChange={handleOffer}
                placeholder="e.g. 10% off all diabetes meds"
              />
            </Field>
            <Field label="Message" htmlFor="campaign-message">
              <Textarea id="campaign-message" rows={4} value={text} onChange={handleMessage} />
            </Field>
            <Button block disabled={recipients.length === 0} onClick={launch}>
              <IconWhatsApp size={16} /> Send to {recipients.length}{" "}
              {channel === "whatsapp" ? "on WhatsApp" : "via SMS"}
            </Button>
            <Text className="!text-[11.5px] !text-muted">
              ⓘ Opens the first recipient prefilled for you to send, and logs the campaign reach.
              Bulk send needs a WhatsApp Business API (can be wired later).
            </Text>
          </Stack>
        </CardBody>
      </Card>
      <Card className="!rounded-md !shadow-sm">
        <Stack
          direction="row"
          align="center"
          justify="between"
          wrap
          className="gap-2.5 border-b border-line px-[18px] py-[15px]"
        >
          <Heading level={3} className="!text-[15px] !font-bold !tracking-normal">
            Campaign history
          </Heading>
          <Text className="!text-[12.5px] !text-muted">{view.crm.campaigns.length} sent</Text>
        </Stack>
        <CardBody className="!p-[18px]">
          {view.crm.campaigns.length === 0 ? (
            <Text className="mx-auto max-w-[340px] px-4 py-4 text-center !text-[13px] !text-muted">
              No campaigns yet.
            </Text>
          ) : (
            <CampaignRows campaigns={view.crm.campaigns} view={view} />
          )}
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
      <Stack
        key={campaign.id}
        direction="row"
        align="center"
        className="gap-3 border-b border-line py-3 last:border-0"
      >
        <Box className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-mid">
          {campaign.channel === "whatsapp" ? (
            <Box className="text-green">
              <IconDot size={8} />
            </Box>
          ) : (
            <IconMail size={15} />
          )}
        </Box>
        <Stack className="min-w-0 flex-1">
          <Text className="!text-[13.5px] !font-bold !text-ink">
            {campaign.name} · {campaign.reach} sent
          </Text>
          <Text className="!text-[12px] !text-muted">
            {segLabel(campaign.segment as Segment) || "All"}
            {campaign.offerLabel ? " · " + campaign.offerLabel : ""} ·{" "}
            {fmtDateTime(campaign.sentAt)}
          </Text>
        </Stack>
        <Stack align="end">
          <Text className="!text-[12px] !font-bold !text-green">{inr(revenue)}</Text>
          <Text className="!text-[11px] !text-muted">attributed</Text>
        </Stack>
      </Stack>
    );
  });
}
