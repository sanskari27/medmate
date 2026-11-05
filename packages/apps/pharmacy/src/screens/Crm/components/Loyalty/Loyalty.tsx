import { inr } from "@/utils";
import { TIERS, type Patient } from "@/utils/calculations/crm";
import { Box, Button, Pill, Stack, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { IconUser } from "@/components/atoms";
import { Card } from "@/components/molecules/Card";
import type { CrmViewProps } from "@/screens/Crm/Crm.types";
import { availablePoints, loyaltyRanking, outstandingPoints, tierMemberCount } from "@/screens/Crm/Crm.utils";

import type { LoyaltyProps } from "./Loyalty.types";
export function Loyalty({ view }: LoyaltyProps) {
  const ranked = loyaltyRanking(view.patients, view.redeemedBy).slice(0, 50);
  const total = outstandingPoints(view.patients, view.redeemedBy);
  return (
    <Stack gap={3}>
      <Stack direction="row" wrap gap={2}>
        <SummaryChip label="Points outstanding" value={total.toLocaleString("en-IN")} />
        <SummaryChip label="≈ Liability" value={inr(total)} />
        <TierChips patients={view.patients} />
      </Stack>
      <Card>
        <Box className="overflow-x-auto">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Patient</TableHeaderCell>
                <TableHeaderCell>Tier</TableHeaderCell>
                <TableHeaderCell align="right">Earned</TableHeaderCell>
                <TableHeaderCell align="right">Redeemed</TableHeaderCell>
                <TableHeaderCell align="right">Available</TableHeaderCell>
                <TableHeaderCell align="right">Value</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHead>
            <TableBody>
              <LoyaltyRows patients={ranked} view={view} />
            </TableBody>
          </Table>
        </Box>
      </Card>
      <Text variant="muted" className="text-[12.5px]">ⓘ Patients earn 1 point per ₹100 spent. Tiers: Silver 12+ · Gold 50+ · Platinum 120+ points. Referral: invite a patient, both get ₹100 credit (use Khata to apply).</Text>
    </Stack>
  );
}

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text className="mt-px block font-display text-[15px] font-extrabold text-dark">{value}</Text>
    </Box>
  );
}

function TierChips({ patients }: { patients: Patient[] }) {
  return TIERS.map(function renderTier(tier) {
    return <SummaryChip key={tier.tier} label={tier.tier} value={String(tierMemberCount(patients, tier.tier))} />;
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
    <TableRow className="cursor-pointer" onClick={handleOpen}>
      <TableCell>
        <Stack direction="row" align="center" gap={2}>
          <Box className="grid h-8 w-8 place-items-center rounded-md bg-wash text-mid"><IconUser size={15} /></Box>
          <Text className="font-bold">{patient.name}</Text>
        </Stack>
      </TableCell>
      <TableCell><Pill tone="gold">{patient.tier}</Pill></TableCell>
      <TableCell align="right">{patient.points}</TableCell>
      <TableCell align="right" className="text-muted">{view.redeemedBy.get(patient.key) ?? 0}</TableCell>
      <TableCell align="right" className="font-extrabold">{available}</TableCell>
      <TableCell align="right">{inr(available)}</TableCell>
      <TableCell align="right" onClick={stopRowClick}>
        <Button size="sm" variant="ghost" disabled={available <= 0} onClick={handleRedeem}>Redeem 50</Button>
      </TableCell>
    </TableRow>
  );
}
