import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconPlus, IconSettings } from "@/components/ui/Icon";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { useListDoctorsQuery } from "@/features/doctors";
import { cn } from "@/utils/className";
import { AdmissionModal } from "../../components/AdmissionModal";
import { AdmissionsTable } from "../../components/AdmissionsTable";
import { AdmitModal } from "../../components/AdmitModal";
import { WardSetupModal } from "../../components/WardSetupModal";
import {
  useAdmitPatientMutation,
  useCreateWardMutation,
  useDischargePatientMutation,
  useListAdmissionsQuery,
  useListWardsQuery,
  useTransferPatientMutation,
  useUpdateWardMutation,
} from "../../wards.api";
import {
  admissionAtBed,
  bedLabels,
  heldLabels,
  occupancy,
  occupiedBeds,
  wardAccess,
  type Admission,
  type PayMode,
  type Ward,
  type WardCategory,
  type WardPayload,
} from "../../model";

const TYPE_TONE: Record<WardCategory, string> = {
  ICU: "bg-rose-bg text-rose",
  General: "bg-gray-pill text-muted",
  Surgical: "bg-blue-bg text-blue",
  Pediatric: "bg-amber-bg text-gold-d",
  Maternity: "bg-teal-bg text-teal",
  Private: "bg-wash text-mid",
};

export function WardsPage() {
  const { session } = useAuthState();
  const access = wardAccess(session?.account.pharmacyRole, session?.account.permissions);
  const canReadDoctors =
    session?.account.pharmacyRole === "owner" ||
    (session?.account.permissions ?? []).includes("doctors:read");
  const wardsQuery = useListWardsQuery();
  const admissionsQuery = useListAdmissionsQuery();
  const doctorsQuery = useListDoctorsQuery(undefined, { skip: !canReadDoctors });
  const [createWard] = useCreateWardMutation();
  const [updateWard] = useUpdateWardMutation();
  const [admitPatient] = useAdmitPatientMutation();
  const [transferPatient] = useTransferPatientMutation();
  const [dischargePatient] = useDischargePatientMutation();
  const [tab, setTab] = useState<"beds" | "admissions">("beds");
  const [setup, setSetup] = useState(false);
  const [admit, setAdmit] = useState<{ wardId: string; bed: string } | true | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wards = wardsQuery.data?.wards ?? [];
  const admissions = admissionsQuery.data?.admissions ?? [];
  const counts = occupancy(wards, admissions);
  const current = admissions.find((row) => row.id === viewId) ?? null;
  const doctors = (doctorsQuery.data?.doctors ?? [])
    .filter((doctor) => doctor.status === "active")
    .map((doctor) => doctor.displayName);
  const now = Date.now();

  async function saveWard(body: WardPayload) {
    setError(null);
    const result = await createWard(body);
    if ("error" in result) setError(problemMessage(result.error, "Could not add this ward"));
  }

  async function patchWard(id: string, body: Partial<WardPayload>) {
    setError(null);
    const result = await updateWard({ id, body });
    if ("error" in result) setError(problemMessage(result.error, "Could not update this ward"));
  }

  async function saveAdmit(body: Parameters<typeof admitPatient>[0]) {
    setError(null);
    const result = await admitPatient(body);
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not admit this patient"));
      return;
    }
    setAdmit(null);
    setViewId(result.data.admission.id);
  }

  async function saveTransfer(wardId: string, bed: string) {
    if (!current) return;
    setError(null);
    const result = await transferPatient({ id: current.id, wardId, bed });
    if ("error" in result)
      setError(problemMessage(result.error, "Could not transfer this patient"));
  }

  async function saveDischarge(payMode: PayMode | null) {
    if (!current) return;
    setError(null);
    const result = await dischargePatient({ id: current.id, payMode });
    if ("error" in result) {
      setError(problemMessage(result.error, "Could not discharge this patient"));
      return;
    }
    setViewId(null);
  }

  if (wardsQuery.isLoading || admissionsQuery.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading wards</Text>;
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      {wardsQuery.isError || admissionsQuery.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(wardsQuery.error ?? admissionsQuery.error, "Could not load wards")}
        </Text>
      ) : null}
      <Box className="mb-4 flex flex-wrap gap-2.5">
        <Stat label="Wards" value={String(wards.length)} />
        <Stat label="Total beds" value={String(counts.beds)} />
        <Stat label="Occupied" value={String(counts.occ)} />
        <Stat label="Free" value={String(counts.free)} />
        <Stat label="Occupancy" value={`${counts.pct}%`} />
        <Stat label="Admitted" value={String(admissions.length)} />
      </Box>
      <Box className="mb-4 flex flex-wrap items-center gap-2.5">
        <Box className="inline-flex max-w-full flex-wrap gap-0.5 rounded-sm border border-line bg-wash-2 p-0.5">
          <Button
            type="button"
            variant="ghost"
            className={tabClass(tab === "beds")}
            onClick={() => setTab("beds")}
          >
            Bed map
          </Button>
          <Button
            type="button"
            variant="ghost"
            className={tabClass(tab === "admissions")}
            onClick={() => setTab("admissions")}
          >
            Admissions ({admissions.length})
          </Button>
        </Box>
        <Box className="flex-1" />
        {access.create || access.update ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setError(null);
              setSetup(true);
            }}
          >
            <IconSettings size={14} /> Manage wards
          </Button>
        ) : null}
        {access.admit ? (
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setAdmit(true);
            }}
          >
            <IconPlus size={16} /> Admit patient
          </Button>
        ) : null}
      </Box>
      {tab === "beds" ? (
        <Box className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
          {wards.map((ward) => (
            <WardCard
              key={ward.id}
              ward={ward}
              admissions={admissions}
              canAdmit={access.admit}
              onOpen={setViewId}
              onAdmit={(bed) => {
                setError(null);
                setAdmit({ wardId: ward.id, bed });
              }}
            />
          ))}
        </Box>
      ) : (
        <AdmissionsTable admissions={admissions} now={now} onOpen={setViewId} />
      )}
      {setup ? (
        <WardSetupModal
          wards={wards}
          canCreate={access.create}
          canUpdate={access.update}
          error={error}
          onClose={() => setSetup(false)}
          onCreate={(body) => void saveWard(body)}
          onUpdate={(id, body) => void patchWard(id, body)}
        />
      ) : null}
      {admit ? (
        <AdmitModal
          wards={wards}
          admissions={admissions}
          doctors={doctors}
          preset={admit === true ? null : admit}
          error={error}
          onClose={() => setAdmit(null)}
          onSave={(body) => void saveAdmit(body)}
        />
      ) : null}
      {current ? (
        <AdmissionModal
          admission={current}
          wards={wards}
          admissions={admissions}
          now={now}
          canTransfer={access.transfer}
          canDischarge={access.discharge}
          error={error}
          onClose={() => setViewId(null)}
          onTransfer={(wardId, bed) => void saveTransfer(wardId, bed)}
          onDischarge={(payMode) => void saveDischarge(payMode)}
        />
      ) : null}
    </Box>
  );
}

function tabClass(selected: boolean) {
  return cn(
    "h-auto rounded-[6px] border-0 px-[13px] py-1.5 text-[12.5px] font-bold",
    selected ? "bg-paper text-dark shadow-sm" : "bg-transparent text-muted shadow-none",
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Box className="rounded-[10px] border border-line bg-paper px-3.5 py-2 text-[12.5px] text-muted">
      {label}
      <Text as="span" className="mt-px block font-display text-[15px] font-bold text-dark">
        {value}
      </Text>
    </Box>
  );
}

function WardCard({
  ward,
  admissions,
  canAdmit,
  onOpen,
  onAdmit,
}: {
  ward: Ward;
  admissions: Admission[];
  canAdmit: boolean;
  onOpen: (id: string) => void;
  onAdmit: (bed: string) => void;
}) {
  const taken = occupiedBeds(admissions, ward.id);
  const held = new Set(heldLabels(ward.code, ward.beds, ward.bedsHeld));
  const pct = ward.beds ? Math.round((taken.size / ward.beds) * 100) : 0;
  const tone = pct >= 85 ? "bg-rose" : pct >= 60 ? "bg-amber" : "bg-mid";
  const text = pct >= 85 ? "text-rose" : pct >= 60 ? "text-amber" : "text-mid";

  return (
    <Box className="flex flex-col rounded-md border border-line bg-paper p-[18px] shadow-sm">
      <Box className="flex items-start justify-between gap-2.5">
        <Box>
          <Heading level={3} className="text-[16px]">
            {ward.name}
          </Heading>
          <Box className="mt-0.5 text-[12.5px] text-muted">
            {ward.code} · {ward.floor || "—"} · {ward.sister || "—"}
          </Box>
        </Box>
        <Text
          as="span"
          className={cn(
            "inline-flex items-center whitespace-nowrap rounded-full px-[9px] py-[3px] text-[11px] font-bold",
            TYPE_TONE[ward.category],
          )}
        >
          {ward.category}
        </Text>
      </Box>
      {ward.underMaintenance ? (
        <Text className="mt-2 text-[12px] font-bold text-amber">
          Maintenance{ward.maintenanceNote ? ` · ${ward.maintenanceNote}` : ""}
        </Text>
      ) : null}
      <Box className="mt-3 mb-[5px] flex items-center justify-between text-[12.5px]">
        <Text as="span" className="text-muted">
          {taken.size}/{ward.beds} beds occupied
        </Text>
        <Text as="span" className={cn("font-bold", text)}>
          {pct}%
        </Text>
      </Box>
      <Box
        className="h-[7px] overflow-hidden rounded-[5px] bg-wash-2"
        role="progressbar"
        aria-label="Beds occupied"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <Box className={cn("h-full", tone)} style={{ width: `${pct}%` }} />
      </Box>
      <Box className="mt-3.5 grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-[7px]">
        {bedLabels(ward.code, ward.beds).map((bed) => {
          const stay = admissionAtBed(admissions, ward.id, bed);
          const isHeld = held.has(bed);
          return (
            <Button
              key={bed}
              type="button"
              variant="ghost"
              title={
                stay ? `${stay.name} · ${stay.uhid}` : isHeld ? `${bed} · held` : `${bed} · free`
              }
              disabled={isHeld || (!stay && (!canAdmit || ward.underMaintenance))}
              className={cn(
                "h-auto min-h-[50px] flex-col gap-0.5 overflow-hidden rounded-[10px] px-1 py-2 shadow-none",
                stay
                  ? "border-[#f3c0c0] bg-rose-bg hover:brightness-[0.98]"
                  : "border-dashed hover:border-mid hover:bg-wash-2",
              )}
              onClick={() => {
                if (stay) onOpen(stay.id);
                else if (canAdmit && !ward.underMaintenance && !isHeld) onAdmit(bed);
              }}
            >
              <Text
                as="span"
                className={cn(
                  "font-mono text-[10px] font-bold",
                  stay ? "text-rose" : isHeld ? "text-amber" : "text-muted",
                )}
              >
                {bed}
              </Text>
              <Text
                as="span"
                className={cn(
                  "max-w-full truncate text-[11px] font-bold",
                  stay ? "text-rose" : isHeld ? "text-amber" : "text-mid",
                )}
              >
                {stay ? stay.name.split(" ")[0] : isHeld ? "Held" : "+ Free"}
              </Text>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}
