import type { CAShare } from "@/utils";
import {
  Box,
  Button,
  Heading,
  Input,
  Label,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { useAppSelector, useConfirmedDispatch } from "@/hooks";
import { faultFrom } from "@/hooks/useConfirmedDispatch";
import { addAdvisor, shareWithCA, updateAdvisor } from "@/store/thunks/auth.thunk";
import {
  CA_REPORT_TYPES,
  inr,
  computeInvoice,
  purchaseTotals,
  fmtDateTime,
  Advisor,
  AdvisorType,
} from "@/utils";
import {
  IconCheck,
  IconSend,
  IconPlus,
  IconEdit,
  IconX,
  IconCalc,
  IconReceipt,
} from "@/components/atoms";
import { CaReportIcon } from "@/components/molecules";
import { togglePicked } from "./CharteredAccountant.utils";
const PERIODS = ["June 2026", "May 2026", "April 2026", "Q1 FY 2026-27", "FY 2025-26"];
const TYPE_PILL: Record<AdvisorType, string> = {
  CA: "!bg-blue-bg !text-blue",
  Accountant: "!bg-wash !text-mid",
};
export default function CAReportScreen() {
  const confirm = useConfirmedDispatch();
  const advisors = useAppSelector((state) => state.auth.advisors);
  const caShares = useAppSelector((state) => state.auth.caShares);
  const sales = useAppSelector((state) => state.sales.sales);
  const purchases = useAppSelector((state) => state.purchases.purchases);
  const profile = useAppSelector((state) => state.auth.profile);
  const [period, setPeriod] = useState(PERIODS[0]);
  const [picked, setPicked] = useState<string[]>(["gst", "sales", "pl"]);
  const [recipient, setRecipient] = useState(advisors[0]?.id ?? "");
  const [edit, setEdit] = useState<Advisor | AdvisorType | null>(null); // Advisor = edit, AdvisorType = add
  const toggle = (k: string) => setPicked((p) => togglePicked(p, k));
  const rec = advisors.find((a) => a.id === recipient) ?? advisors[0];
  const live = sales
    .filter((s) => s.status !== "cancelled")
    .map((s) => computeInvoice(s.items, s.discount));
  const outputGst = live.reduce((a, t) => a + t.totalTax, 0);
  const inputGst = purchases.reduce((a, p) => a + purchaseTotals(p.items).gst, 0);
  const netRev = live.reduce((a, t) => a + t.payable, 0);
  return (
    <Box className={cn("!mx-auto !max-w-[1680px]", "!max-w-[1040px]")}>
      <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
        {/* compose share */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Share reports</Heading>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className={cn("!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1", "!mb-1")}>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Reporting period</Label>
                <Select
                  className=""
                  value={period}
                  onChange={setPeriodOnChange}
                  options={[...PERIODS.map(renderPERIODS)]}
                />
              </Box>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Send to</Label>
                <Select
                  className=""
                  value={recipient}
                  onChange={setRecipientOnChange}
                  options={[...advisors.map(renderAdvisor)]}
                />
              </Box>
            </Box>
            <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
              Include reports
            </Box>
            {CA_REPORT_TYPES.map(renderCAREPORTTYPES)}
            <Button
              disabled={picked.length === 0 || !rec}
              onClick={shareWithCAOnClick}
              className="!mt-4 !w-full"
            >
              <IconSend size={16} /> Share {picked.length} report{picked.length !== 1 ? "s" : ""}
              {rec ? ` with ${rec.name.split(" ").slice(-1)[0]}` : ""}
            </Button>
            <Text className={cn("!text-muted", "!text-[11.5px] !mt-2.5")}>
              This saves the share on your account. It does not email the reports.
            </Text>
          </Box>
        </Box>

        {/* advisors + snapshot */}
        <Box>
          <Box
            className={cn(
              "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm",
              "!mb-4",
            )}
          >
            <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
              <Heading level={3}>Your CA &amp; Accountant</Heading>
              <Box className="!flex !items-center !gap-1.5">
                <Button
                  className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
                  onClick={setEditOnClick}
                >
                  <IconPlus size={14} /> CA
                </Button>
                <Button
                  className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
                  onClick={setEditOnClick2}
                >
                  <IconPlus size={14} /> Accountant
                </Button>
              </Box>
            </Box>
            <Box className={cn("!flex-1 !p-[18px]", "!pt-2 !pb-2")}>
              {advisors.length === 0 && (
                <Box
                  className={cn(
                    "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                    "!p-5",
                  )}
                >
                  <Text>No advisors yet. Add your CA or accountant.</Text>
                </Box>
              )}
              {advisors.map(renderAdvisor2)}
            </Box>
          </Box>

          <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
            <Box
              className={cn(
                "!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0",
                "!mt-0",
              )}
            >
              Snapshot (all data)
            </Box>
            <Box className="!flex !flex-col">
              <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
                <Text className="text-ink-2" as="span">
                  GSTIN
                </Text>
                <Text className={cn("font-bold tabular-nums !font-mono", "!text-[12px]")} as="span">
                  {profile.gstin}
                </Text>
              </Box>
              <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
                <Text className="text-ink-2" as="span">
                  Net revenue
                </Text>
                <Text className="font-bold tabular-nums" as="span">
                  {inr(netRev)}
                </Text>
              </Box>
              <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
                <Text className="text-ink-2" as="span">
                  Output GST
                </Text>
                <Text className="font-bold tabular-nums" as="span">
                  {inr(outputGst)}
                </Text>
              </Box>
              <Box className="flex items-baseline justify-between border-b border-line py-[9px] last:border-b-0">
                <Text className="text-ink-2" as="span">
                  Input GST credit
                </Text>
                <Text className="font-bold tabular-nums" as="span">
                  {inr(inputGst)}
                </Text>
              </Box>
              <Box className="mt-1 flex items-baseline justify-between border-t-2 border-line-2 pt-3 font-display text-base font-extrabold text-dark">
                <Text className="text-ink-2" as="span">
                  Net GST
                </Text>
                <Text
                  className={`font-extrabold tabular-nums ${outputGst - inputGst >= 0 ? "text-rose" : "text-green"}`}
                  as="span"
                >
                  {inr(Math.abs(outputGst - inputGst))}
                  {outputGst - inputGst < 0 ? " cr" : ""}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        className={cn(
          "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm",
          "!mt-4",
        )}
      >
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Sharing history</Heading>
        </Box>
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2 [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-t-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold [&_tfoot_td]:!text-ink">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Ref</TableHeaderCell>
                <TableHeaderCell>Period</TableHeaderCell>
                <TableHeaderCell>Reports</TableHeaderCell>
                <TableHeaderCell>Shared with</TableHeaderCell>
                <TableHeaderCell>When</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {caShares.map(renderCaShare)}
              {caShares.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box
                      className={cn(
                        "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                        "!p-6",
                      )}
                    >
                      <Text>No reports shared yet.</Text>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {edit && (
        <AdvisorModal initial={edit} onClose={setEditOnClose} onSave={updateAdvisorOnSave} />
      )}
    </Box>
  );
  function setPeriodOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setPeriod(e.target.value);
  }
  function renderPERIODS(p: string) {
    return { value: String(p), label: String(p) };
  }
  function setRecipientOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setRecipient(e.target.value);
  }
  function renderAdvisor(a: Advisor) {
    return { value: String(a.id), label: String(a.name) + " (" + String(a.type) + ")" };
  }
  function renderCAREPORTTYPES(r: { key: string; label: string; icon: string }) {
    return (
      <Label
        key={r.key}
        className={cn(
          "!flex !items-center !gap-2.5",
          "!justify-between !py-[9px] !px-0 !border-b !border-line !cursor-pointer",
        )}
      >
        <Text className={cn("!flex !items-center !gap-2", "!gap-2 !text-[13.5px]")} as="span">
          <CaReportIcon k={r.icon} size={15} /> {r.label}
        </Text>
        <Button
          type="button"
          className={cn(
            "!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !p-0 !shadow-none active:!translate-y-0 after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:!transition after:!content-['']",
            picked.includes(r.key)
              ? "!bg-mid hover:!bg-mid after:!translate-x-4"
              : "!bg-[#cddcd3] hover:!bg-[#cddcd3]",
          )}
          onClick={toggleOnClick}
        />
      </Label>
    );
    function toggleOnClick() {
      return toggle(r.key);
    }
  }
  function shareWithCAOnClick() {
    void confirm(shareWithCA({ period, reports: picked, advisorId: recipient }));
  }
  function setEditOnClick() {
    return setEdit("CA");
  }
  function setEditOnClick2() {
    return setEdit("Accountant");
  }
  function renderAdvisor2(a: Advisor) {
    return (
      <Box
        className="!flex !items-center !gap-3 !border-b !border-line !py-2.5 last:!border-b-0"
        key={a.id}
      >
        <Text
          className={cn(
            "!w-[42px] !h-[42px] !rounded-full !bg-wash !grid !place-items-center !shrink-0",
          )}
          as="span"
        >
          {a.type === "CA" ? <IconCalc size={20} /> : <IconReceipt size={20} />}
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="flex items-center gap-1.5 text-[13.5px] font-bold text-ink !flex !items-center !gap-1.5">
            {a.name}{" "}
            <Text
              className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${TYPE_PILL[a.type]}`}
              as="span"
            >
              {a.type}
            </Text>
          </Box>
          <Box className="text-xs text-muted">
            {a.firm} · {a.email} · {a.phone}
          </Box>
        </Text>
        <Button
          className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid"
          title="Edit"
          onClick={setEditOnClick3}
        >
          <IconEdit size={15} />
        </Button>
      </Box>
    );
    function setEditOnClick3() {
      return setEdit(a);
    }
  }
  function renderCaShare(s: CAShare) {
    return (
      <TableRow key={s.id}>
        <TableCell className={cn("!font-mono", "!font-bold")}>{s.id}</TableCell>
        <TableCell>{s.period}</TableCell>
        <TableCell>{s.reports.map(matchReport).join(", ")}</TableCell>
        <TableCell>
          {s.recipient}
          <Box className={cn("!text-muted !font-mono", "!text-[11px]")}>{s.sentTo}</Box>
        </TableCell>
        <TableCell>{fmtDateTime(s.createdAt)}</TableCell>
        <TableCell>
          <Text
            className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid"
            as="span"
          >
            <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
            Shared
          </Text>
        </TableCell>
      </TableRow>
    );
    function matchReport(r: string) {
      return CA_REPORT_TYPES.find(matchCAREPORTTYPES)?.label.split(" ")[0];
      function matchCAREPORTTYPES(x: { key: string; label: string; icon: string }) {
        return x.key === r;
      }
    }
  }
  function setEditOnClose() {
    return setEdit(null);
  }
  async function updateAdvisorOnSave(advisor: Omit<Advisor, "id">, id: string | undefined) {
    const error = id
      ? faultFrom(await confirm(updateAdvisor({ id, patch: advisor }), { kind: "edit" }))
      : faultFrom(await confirm(addAdvisor(advisor)));
    if (!error) setEdit(null);
  }
}
function AdvisorModal({
  initial,
  onClose,
  onSave,
}: {
  initial: Advisor | AdvisorType;
  onClose: () => void;
  onSave: (a: Omit<Advisor, "id">, id?: string) => void;
}) {
  const isEdit = typeof initial !== "string";
  const [f, setF] = useState<Omit<Advisor, "id">>(
    isEdit
      ? {
          type: initial.type,
          name: initial.name,
          firm: initial.firm,
          email: initial.email,
          phone: initial.phone,
        }
      : { type: initial, name: "", firm: "", email: "", phone: "" },
  );
  const set = (p: Partial<typeof f>) => setF((s) => ({ ...s, ...p }));
  return (
    <Box
      className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px] max-[767px]:!items-end max-[767px]:!p-0"
      onClick={onClose}
    >
      <Box
        className="!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop max-[767px]:!max-h-[92dvh] max-[767px]:!max-w-none max-[767px]:!rounded-t-2xl max-[767px]:!rounded-b-none"
        onClick={stopPropagationOnClick}
      >
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>{isEdit ? `Edit ${initial.name}` : `Add ${f.type}`}</Heading>
          <Button
            className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash"
            onClick={onClose}
          >
            <IconX size={18} />
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box
            className={cn(
              "!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2",
              "!mb-3",
            )}
          >
            <Label>Type</Label>
            <Box className="!flex !items-center !gap-1.5">
              {(["CA", "Accountant"] as AdvisorType[]).map(renderT)}
            </Box>
          </Box>
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box
              className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1"
              data-field="name"
            >
              <Label>Name</Label>
              <Input
                className=""
                value={f.name}
                onChange={setOnChange}
                placeholder={f.type === "CA" ? "CA Sunil Sharma" : "Meena Iyer"}
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Firm / organisation</Label>
              <Input className="" value={f.firm} onChange={setOnChange2} />
            </Box>
            <Box
              className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2"
              data-field="email"
            >
              <Label>Email</Label>
              <Input className="" value={f.email} onChange={setOnChange3} />
            </Box>
            <Box
              className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2"
              data-field="phone"
            >
              <Label>Phone</Label>
              <Input className="" value={f.phone} onChange={setOnChange4} />
            </Box>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5 max-[767px]:!flex-wrap max-[767px]:[&_button]:!flex-1">
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            disabled={!f.name.trim() || !f.email.trim()}
            onClick={onSaveOnClick}
          >
            <IconCheck size={15} /> {isEdit ? "Save" : "Add"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function renderT(t: AdvisorType) {
    return (
      <Button
        key={t}
        className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${f.type === t ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
        onClick={setOnClick}
      >
        {t === "CA" ? (
          <>
            <IconCalc size={13} /> Chartered Accountant
          </>
        ) : (
          <>
            <IconReceipt size={13} /> Accountant
          </>
        )}
      </Button>
    );
    function setOnClick() {
      return set({ type: t });
    }
  }
  function setOnChange(e: ChangeEvent<HTMLInputElement>) {
    return set({ name: e.target.value });
  }
  function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
    return set({ firm: e.target.value });
  }
  function setOnChange3(e: ChangeEvent<HTMLInputElement>) {
    return set({ email: e.target.value });
  }
  function setOnChange4(e: ChangeEvent<HTMLInputElement>) {
    return set({ phone: e.target.value });
  }
  function onSaveOnClick() {
    return onSave(f, isEdit ? initial.id : undefined);
  }
}
