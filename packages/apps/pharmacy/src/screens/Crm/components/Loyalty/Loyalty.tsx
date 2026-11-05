import { inr } from "@/utils";
import { TIERS, type Patient } from "@/utils/calculations/crm";
import {
  Box,
  Button,
  Pill,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { IconUser } from "@/components/atoms";
import { Card } from "@/components/molecules/Card";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import {
  availablePoints,
  loyaltyRanking,
  outstandingPoints,
  tierMemberCount,
} from "@/screens/Crm/Crm.utils";

import type { LoyaltyProps } from "./Loyalty.types";

const card = "!rounded-md !shadow-sm";
const crmTable =
  "!border-separate border-spacing-0 text-[13px] [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-100 [&_tbody_tr:hover]:bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0";
const th =
  "!sticky !top-0 z-[1] !border-b !border-line !bg-wash-2 !px-3.5 !py-[11px] !text-[10.5px] !font-bold !uppercase !tracking-[0.07em] !whitespace-nowrap !text-muted";
const td = "!border-b !border-line !px-3.5 !py-[11px] align-middle !text-ink-2";
const num = `${td} !text-right !tabular-nums !text-ink`;

export function Loyalty({ view }: LoyaltyProps) {
  const ranked = loyaltyRanking(view.patients, view.redeemedBy).slice(0, 50);
  const total = outstandingPoints(view.patients, view.redeemedBy);
  return (
    <Stack gap={0}>
      <Stack direction="row" wrap className="mb-3.5 gap-[10px]">
        <SummaryChip label="Points outstanding" value={total.toLocaleString("en-IN")} />
        <SummaryChip label="≈ Liability" value={inr(total)} />
        <TierChips patients={view.patients} />
      </Stack>
      <Card className={card}>
        <Box className="overflow-x-auto">
          <Table className={crmTable}>
            <TableHead>
              <TableRow className="!border-0">
                <TableHeaderCell className={th}>Patient</TableHeaderCell>
                <TableHeaderCell className={th}>Tier</TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Earned
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Redeemed
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Available
                </TableHeaderCell>
                <TableHeaderCell align="right" className={th}>
                  Value
                </TableHeaderCell>
                <TableHeaderCell className={th} />
              </TableRow>
            </TableHead>
            <TableBody>
              <LoyaltyRows patients={ranked} view={view} />
            </TableBody>
          </Table>
        </Box>
      </Card>
      <Text variant="muted" className="mt-2.5 !text-[12.5px]">
        ⓘ Patients earn 1 point per ₹100 spent. Tiers: Silver 12+ · Gold 50+ · Platinum 120+ points.
        Referral: invite a patient, both get ₹100 credit (use Khata to apply).
      </Text>
    </Stack>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text className="mt-px block font-display text-[15px] font-bold text-dark">{value}</Text>
    </Box>
  );
}

function TierChips({ patients }: { patients: Patient[] }) {
  return TIERS.map(function renderTier(tier) {
    return (
      <SummaryChip
        key={tier.tier}
        label={tier.tier}
        value={String(tierMemberCount(patients, tier.tier))}
      />
    );
  });
}

function LoyaltyRows({ patients, view }: { patients: Patient[]; view: CrmViewProps }) {
  return patients.map(function renderRow(patient) {
    return <LoyaltyRow key={patient.key} patient={patient} view={view} />;
  });
}

function LoyaltyRow({ patient, view }: { patient: Patient; view: CrmViewProps }) {
  const available = availablePoints(patient, view.redeemedBy);
  function handleOpen() {
    view.openPatient(patient.key);
  }
  function stopRowClick(event: { stopPropagation: () => void }) {
    event.stopPropagation();
  }
  function handleRedeem() {
    view.redeemPoints(patient.key, patient.name, Math.min(available, 50));
  }
  return (
    <TableRow className="!border-0 cursor-pointer" onClick={handleOpen}>
      <TableCell className={td}>
        <Stack direction="row" align="center" gap={0} className="gap-2.5">
          <Box className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-mid">
            <IconUser size={15} />
          </Box>
          <Text className="!font-bold !text-ink">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell className={td}>
        <Pill tone="gold">{patient.tier}</Pill>
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {patient.points}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold !text-muted`}>
        {view.redeemedBy.get(patient.key) ?? 0}
      </TableCell>
      <TableCell align="right" className={`${num} !font-extrabold`}>
        {available}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`}>
        {inr(available)}
      </TableCell>
      <TableCell align="right" className={`${num} !font-semibold`} onClick={stopRowClick}>
        <Button variant="ghost" disabled={available <= 0} onClick={handleRedeem}>
          Redeem 50
        </Button>
      </TableCell>
    </TableRow>
  );
}
