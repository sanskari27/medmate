import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAuthState } from "@/features/authentication";
import { patientSet } from "@/features/billing";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { IconCredit, IconHistory, IconReceipt } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { PageBar } from "@/components/ui/PageBar";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { CreditDialog } from "../../components/CreditDialog";
import {
  canUpdatePatients,
  type PatientRow,
  type PatientSegment,
  type PatientSort,
} from "../../model";
import {
  useLazyExportPatientsQuery,
  useListPatientsQuery,
  useReadPatientQuery,
} from "../../patients.api";
import {
  download,
  exportCsv,
  exportText,
  rupee,
  segmentLabel,
  visitDate,
} from "../../patientsView";

export function PatientsPage() {
  const { session } = useAuthState();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const canUpdate = canUpdatePatients(session?.account.pharmacyRole, session?.account.permissions);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<PatientSort>("spent");
  const [segment, setSegment] = useState<PatientSegment>("all");
  const [phone, setPhone] = useState<string | null>(null);
  const [creditOpen, setCreditOpen] = useState(false);
  const list = useListPatientsQuery({ page, q, sort, segment });
  const detail = useReadPatientQuery(phone ?? "", { skip: !phone });
  const [exportPatients] = useLazyExportPatientsQuery();
  const summary = list.data?.summary;
  const rows = list.data?.patients ?? [];

  function openHistory(row: PatientRow) {
    navigate(`/sales?q=${encodeURIComponent(row.phone)}`);
  }

  function openBill(row: PatientRow) {
    dispatch(patientSet({ name: row.name, phone: row.phone }));
    navigate("/billing");
  }

  function openCredit(row: PatientRow) {
    setPhone(row.phone);
    setCreditOpen(true);
  }

  async function downloadExport(kind: "csv" | "pdf") {
    const result = await exportPatients({ q, sort, segment }).unwrap();
    if (kind === "csv") download("patients.csv", exportCsv(result.patients), "text/csv");
    else download("patients.txt", exportText(result.patients), "text/plain");
  }

  return (
    <Stack gap={3}>
      <Box className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Stat label="Customers" value={String(summary?.named ?? 0)} hint="Named on a bill" />
        <Stat
          label="Lifetime sales"
          value={rupee(summary?.lifetimeSales)}
          hint="All billed payables"
        />
        <Stat
          label="Repeat customers"
          value={String(summary?.repeat ?? 0)}
          hint="More than one order"
        />
        <Stat
          label="Credit outstanding"
          value={rupee(summary?.creditOutstanding)}
          hint="Still on khata"
        />
        <Stat
          label="Active (30d)"
          value={String(summary?.active30 ?? 0)}
          hint="Visited in 30 days"
        />
        <Stat label="At-risk" value={String(summary?.atRisk ?? 0)} hint="Quiet for 60 days" />
      </Box>
      <Box className="grid gap-3 md:grid-cols-3">
        {(list.data?.aging ?? []).map((bucket) => (
          <Stat
            key={bucket.key}
            label={bucket.label}
            value={rupee(bucket.amount)}
            hint={`${bucket.count} ${bucket.count === 1 ? "bill" : "bills"}`}
          />
        ))}
      </Box>
      <Stack direction="row" gap={2} align="center" className="flex-nowrap">
        <Box className="min-w-0 flex-1">
          <Input
            aria-label="Search patients"
            placeholder="Search name or phone"
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </Box>
        <select
          aria-label="Sort"
          value={sort}
          onChange={(event) => setSort(event.target.value as PatientSort)}
          className="shrink-0 rounded-sm border border-line-2 bg-paper px-3 py-2 text-[13px]"
        >
          <option value="spent">Lifetime</option>
          <option value="orders">Orders</option>
          <option value="recent">Recent</option>
        </select>
        <select
          aria-label="Segment"
          value={segment}
          onChange={(event) => {
            setSegment(event.target.value as PatientSegment);
            setPage(1);
          }}
          className="shrink-0 rounded-sm border border-line-2 bg-paper px-3 py-2 text-[13px]"
        >
          <option value="all">All</option>
          <option value="high-value">High value</option>
          <option value="lapsed">Lapsed / at-risk</option>
          <option value="new">New</option>
          <option value="credit">On credit</option>
          <option value="regular">Regular</option>
        </select>
        {canUpdate ? (
          <>
            <Button type="button" variant="secondary" onClick={() => void downloadExport("csv")}>
              Excel
            </Button>
            <Button type="button" variant="secondary" onClick={() => void downloadExport("pdf")}>
              PDF
            </Button>
          </>
        ) : null}
      </Stack>
      {rows.length === 0 ? (
        <Text>{q.trim() ? "No patients match your search." : "No patients yet."}</Text>
      ) : (
        <Box className="overflow-x-auto rounded-md border border-line bg-paper">
          <table className="w-full border-separate border-spacing-0 text-[13px]">
            <thead>
              <tr>
                {[
                  "Patient",
                  "Phone",
                  "Orders",
                  "Lifetime",
                  "Last visit",
                  "Segment",
                  "Credit due",
                  "",
                ].map((heading) => (
                  <th
                    key={heading || "actions"}
                    className="border-b border-line px-3 py-2 text-left text-[11px] font-bold uppercase text-muted"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.phone}>
                  <td className="border-b border-line px-3 py-2">{row.name}</td>
                  <td className="border-b border-line px-3 py-2">{row.phone}</td>
                  <td className="border-b border-line px-3 py-2">{row.orders}</td>
                  <td className="border-b border-line px-3 py-2">{rupee(row.spent)}</td>
                  <td className="border-b border-line px-3 py-2">{visitDate(row.lastAt)}</td>
                  <td className="border-b border-line px-3 py-2">
                    {row.segments.map(segmentLabel).join(", ")}
                  </td>
                  <td className="border-b border-line px-3 py-2">{rupee(row.creditOutstanding)}</td>
                  <td className="border-b border-line px-3 py-2 text-right">
                    <Stack direction="row" gap={1} justify="end">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`History for ${row.name}`}
                        onClick={() => openHistory(row)}
                      >
                        <IconHistory size={16} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Credit for ${row.name}`}
                        onClick={() => openCredit(row)}
                      >
                        <IconCredit size={16} />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        aria-label={`Bill for ${row.name}`}
                        onClick={() => openBill(row)}
                      >
                        <IconReceipt size={16} />
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <PageBar
            page={list.data?.page ?? page}
            size={list.data?.size ?? 25}
            total={list.data?.total ?? 0}
            onPage={setPage}
          />
        </Box>
      )}

      {creditOpen && phone && detail.data?.patient ? (
        <CreditDialog
          canUpdate={canUpdate}
          patient={detail.data.patient}
          onClose={() => setCreditOpen(false)}
        />
      ) : null}
    </Stack>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <Box className="rounded-md border border-line bg-paper p-4 shadow-sm">
      <Text className="text-[11px] font-bold text-muted uppercase">{label}</Text>
      <Text className="text-[22px] font-bold text-dark">{value}</Text>
      <Text className="text-[12px] text-muted">{hint}</Text>
    </Box>
  );
}
