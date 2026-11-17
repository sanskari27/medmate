import { Box, Button, Heading, Text as TextComponent } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useAppSelector } from "@/app/store/hooks";
import { useGetMeQuery, useListPatientsQuery } from "@/services/api/api";
import { problemMessage } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { filterParams, usePatientCounts } from "@/features/patients";
import { buildLandingSummary, money } from "@/features/landing/service/landingSummary";
import type { ClinicPatient } from "@/types";

const LANDING_PAGE_SIZE = 100;

export function LandingPage() {
  const { session } = useAppSelector((state) => state.auth);
  const me = useGetMeQuery(undefined, { skip: !session });
  const counts = usePatientCounts();
  const patients = useListPatientsQuery({ size: LANDING_PAGE_SIZE, sort: "name" }, { skip: !session });
  const navigate = useNavigate();

  if (me.isLoading) {
    return <TextComponent className="text-[13.5px] text-muted">Loading clinic</TextComponent>;
  }

  if (me.isError) {
    return (
      <TextComponent className="mb-3 text-[12.5px] font-bold text-red">
        {problemMessage(me.error, "Could not load clinic")}
      </TextComponent>
    );
  }

  if (!me.data) {
    return <TextComponent className="text-[13.5px] text-muted">Clinic not found</TextComponent>;
  }

  const { role, grants, clinicName } = me.data;
  const canSeeMoney = grants.includes("clinic:billing:read");
  const canSeeClinical = grants.includes("clinic:patients:read_clinical");
  const items = (patients.data?.items ?? []) as ClinicPatient[];
  const summary = buildLandingSummary(role, counts, grants);

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Box className="mb-4 rounded-card border border-line bg-surface px-5 py-4">
        <Heading level={2} className="text-[22px] font-bold">
          {summary.title}
        </Heading>
        <TextComponent className="mt-1 text-[13px] text-muted">{summary.subtitle}</TextComponent>
      </Box>

      <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary.stats.map((stat) => (
          <Button
            key={stat.label}
            type="button"
            variant="ghost"
            className="rounded-card border border-line bg-surface p-2"
            onClick={() => navigate(`/patients?${new URLSearchParams(filterParams(stat.filter ?? {})).toString()}`)}
            aria-label={`View ${stat.label}`}
          >
            <Box className="flex flex-col items-center gap-2 p-2">
              <Box className="grid h-10 w-10 place-items-center rounded-control bg-surface-3">
                <Icon name="users" size={20} className="text-ink-2" />
              </Box>
              <TextComponent className="text-[11px] font-bold tracking-[0.05em] text-muted uppercase">
                {stat.label}
              </TextComponent>
              <TextComponent className="text-[24px] font-extrabold tabular-nums text-ink">
                {stat.value}
              </TextComponent>
            </Box>
          </Button>
        ))}
      </Box>

      {patients.isError ? (
        <Box className="mt-4 rounded-card border border-red-bg bg-red-bg p-4">
          <TextComponent className="text-[13px] font-bold text-red">
            {problemMessage(patients.error, "Could not load the patient list")}
          </TextComponent>
        </Box>
      ) : (
        <Box className="mt-4 rounded-card border border-line bg-surface">
          <Box className="border-b border-line px-5 py-4">
            <Heading level={2} className="text-[18px] font-bold">
              {clinicName}
            </Heading>
          </Box>
          <Box className="overflow-x-auto">
            {items.length === 0 ? (
              <Box className="px-6 py-12 text-center">
                <Icon name="users" size={48} className="mx-auto mb-3 text-muted" />
                <TextComponent className="text-[14px] font-bold text-ink mb-1">No patients yet</TextComponent>
                <TextComponent className="text-[13px] text-muted mx-auto max-w-[340px]">
                  Patients appear here as soon as the clinic starts seeing them.
                </TextComponent>
              </Box>
            ) : (
              <ul>
                {items.map((patient) => (
                  <li
                    key={patient.id}
                    className="flex items-center justify-between gap-4 border-b border-line px-5 py-3 last:border-b-0"
                  >
                    <Box>
                      <TextComponent className="text-[14px] font-bold text-ink">{patient.name}</TextComponent>
                      <TextComponent className="text-[12.5px] text-muted">
                        {patient.age} {patient.sex} · {patient.phone}
                      </TextComponent>
                    </Box>
                    <Box className="flex items-center gap-3">
                      {canSeeClinical && patient.conditions ? (
                        <span className="chip">{patient.conditions}</span>
                      ) : null}
                      {canSeeMoney && patient.due ? (
                        <span className="chip border-gold-100 text-gold-ink">{money(patient.due)}</span>
                      ) : null}
                      <span
                        className="grid h-6 w-6 place-items-center rounded-pill"
                        title={patient.status}
                        aria-label={patient.status}
                        role="img"
                      >
                        <span
                          className={`h-2 w-2 rounded-pill ${
                            patient.status === "waiting"
                              ? "bg-gold"
                              : patient.status === "with-doctor"
                                ? "bg-blue"
                                : "bg-mint-300"
                          }`}
                        />
                      </span>
                    </Box>
                  </li>
                ))}
              </ul>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
