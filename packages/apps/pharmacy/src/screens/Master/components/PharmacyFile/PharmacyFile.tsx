import type { PharmacyFileProps } from "./PharmacyFile.types";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { BillingCycle, HOSPITAL_ROUTES, Plan, PREMIUM_ROUTES } from "@/utils";
import { kycGaps } from "@/screens/Master/utils/kycGaps";
import { seatText } from "@/screens/Master/utils/seatText";
type Seats = {
    included: number | null;
    extra: number;
    inUse: number;
    limit: number | null;
};
type Kyc = {
    gstin: string;
    pan: string;
    dlNo: string;
    fssai: string;
    pharmacist?: string;
    bank?: {
        bankName?: string;
        accountNumber?: string;
        ifsc?: string;
    } | null;
};
type Row = {
    id: string;
    phone: string;
    name: string;
    city: string;
    plan: string;
    cycle: string;
    status: string;
    renewsOn: string;
    businessType: string;
    seats: Seats;
    kyc: Kyc;
};
type Grant = {
    route: string;
    until?: string;
};
type Ticket = {
    id: string;
    subject: string;
    status: string;
    pharmacyId?: string;
    pharmacyName?: string;
    category?: string;
};
type Referral = {
    id: string;
    name: string;
    status: string;
    reward: number;
    paidAt?: number;
    paidBy?: string;
    pharmacyId?: string;
    pharmacyName?: string;
};
type Profile = Row & {
    tickets: Ticket[];
    referrals: Referral[];
    grants: Grant[];
    requests: {
        id: string;
        plan: string;
        cycle: string;
        kind: string;
        createdAt: number;
        status: string;
    }[];
};
const LABELS: Record<string, string> = {
    orders: "Orders",
    sales: "Sales",
    prescriptions: "Prescriptions",
    customers: "Customers",
    khata: "Credit · Khata",
    crm: "CRM",
    rackmap: "Rack map",
    reorder: "Reorder",
    distributors: "Distributors",
    online: "Online store",
    offers: "Offers",
    kiosk: "Kiosk",
    reports: "Reports",
    expenses: "Expenses",
    ca: "CA",
    employees: "Employees",
    wards: "IPD · Wards",
    hospbill: "Hospital Billing",
    ptbills: "Active Patients",
    salesreg: "Sales Register",
    indents: "Ward Indents",
    departments: "Departments",
    doctors: "Doctors",
};
const PLANS: Plan[] = ["Essential", "Care", "Growth", "Flagship"];
export function PharmacyFile({ profile, reason, setReason, nextPlan, setNextPlan, cycle, setCycle, renewsOn, setRenewsOn, extra, setExtra, grants, setGrants, save, onImpersonate, }: PharmacyFileProps) {
    const gaps = kycGaps(profile);
    return (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
      <Text className="!text-muted">
        {profile.businessType} · {profile.plan} {profile.cycle} · renews {profile.renewsOn} ·{" "}
        {seatText(profile.seats)}
      </Text>
      <Button onClick={onImpersonate} className={cn("!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green", "!my-2 !mx-0")}>
        Open this pharmacy
      </Button>
      <Text>
        KYC: GSTIN {profile.kyc.gstin || "—"} · PAN {profile.kyc.pan || "—"} · Drug licence{" "}
        {profile.kyc.dlNo || "—"} · FSSAI {profile.kyc.fssai || "—"} · Pharmacist{" "}
        {profile.kyc.pharmacist || "—"} · Bank{" "}
        {profile.kyc.bank
            ? `${profile.kyc.bank.bankName || ""} ${profile.kyc.bank.accountNumber || ""} ${profile.kyc.bank.ifsc || ""}`
            : "—"}
      </Text>
      {gaps.length > 0 && (<Text className="!mb-3 !rounded-sm !border !border-[#f3c0c0] !bg-rose-bg !px-3 !py-2.5 !text-[13px] !font-bold !text-rose">
          Missing {gaps.join(", ")}. The pharmacy fills these in Settings. This desk does not
          approve them.
        </Text>)}
      <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!my-3 !mx-0")}>
        <Label>Reason</Label>
        <Input className="" value={reason} onChange={setReasonOnChange} placeholder="Why this change"/>
      </Box>
      <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap !mb-3")}>
        <Select className="" value={nextPlan} onChange={setNextPlanOnChange} aria-label="Plan" options={[...(PLANS.map(renderPLANS))]} />
        <Select className="" value={cycle} onChange={setCycleOnChange} aria-label="Billing cycle" options={[{ value: "monthly", label: "Monthly" }, { value: "annual", label: "Annual" }]} />
        <Input className="" type="date" value={renewsOn} onChange={setRenewsOnOnChange} aria-label="Renewal date"/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={saveOnClick}>
          Save plan
        </Button>
      </Box>
      <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap !mb-3")}>
        <Input className="" type="number" min={0} max={50} value={extra} onChange={setExtraOnChange} aria-label="Extra seats"/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={saveOnClick2}>
          Save seats
        </Button>
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={confirmOnClick}>
          Set {profile.businessType === "hospital" ? "retail" : "hospital"}
        </Button>
      </Box>
      <Heading level={4}>Screen access</Heading>
      <Text className="!text-muted">
        Grants open a screen on Free and after a paid plan lapses. An active paid plan ignores them.
        Hospital screens also need the hospital business type.
      </Text>
      {PREMIUM_ROUTES.map(renderPREMIUMROUTES)}
      <Button onClick={saveOnClick3} className={cn("!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green", "!mt-2")}>
        Save screen access
      </Button>
      <Heading className={cn("!mt-4")} level={4}>Open tickets</Heading>
      {profile.tickets.length === 0 ? (<Text className="!text-muted">No open tickets.</Text>) : (profile.tickets.map(renderTicket))}
      <Heading level={4}>Referrals</Heading>
      {profile.referrals.length === 0 ? (<Text className="!text-muted">No referrals.</Text>) : (profile.referrals.map(renderReferral))}
    </Box>);
    function setReasonOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setReason(e.target.value);
    }
    function setNextPlanOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setNextPlan(e.target.value as Plan);
    }
    function renderPLANS(item: Plan) {
        return { value: String(item), label: String(item) };
    }
    function setCycleOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setCycle(e.target.value as BillingCycle);
    }
    function setRenewsOnOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setRenewsOn(e.target.value);
    }
    function saveOnClick() {
        return save(`/master/pharmacies/${profile.id}/plan`, "PATCH", {
            plan: nextPlan,
            cycle,
            renewsOn: nextPlan === "Essential" ? "—" : renewsOn,
        });
    }
    function setExtraOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setExtra(Number(e.target.value));
    }
    function saveOnClick2() {
        return save(`/master/pharmacies/${profile.id}/seats`, "PATCH", { extraSeats: extra });
    }
    function confirmOnClick() {
        const next = profile.businessType === "hospital" ? "pharmacy" : "hospital";
        if (!confirm(`Change this pharmacy to ${next === "hospital" ? "hospital" : "retail"}? Hospital screens follow this choice.`))
            return;
        void save(`/master/pharmacies/${profile.id}/business-type`, "PATCH", {
            businessType: next,
        });
    }
    function renderPREMIUMROUTES(route: string) {
        const grant = grants.find(matchGrant);
        return (<Label key={route} className={cn("!flex !items-center !gap-1.5", "!my-1 !mx-0")}>
            <Input type="checkbox" checked={Boolean(grant)} onChange={setGrantsOnChange}/>
            <Text as="span">
              {LABELS[route] || route}
              {HOSPITAL_ROUTES.includes(route) ? " · hospital" : ""}
            </Text>
            {grant && (<Input className="" type="date" value={grant.until || ""} onChange={setGrantsOnChange2} aria-label={`${LABELS[route] || route} expiry`}/>)}
          </Label>);
        function matchGrant(item: Grant) {
            return item.route === route;
        }
        function setGrantsOnChange(e: ChangeEvent<HTMLInputElement>) {
            return setGrants((list) => e.target.checked
                ? [...list, { route }]
                : list.filter((item) => item.route !== route));
        }
        function setGrantsOnChange2(e: ChangeEvent<HTMLInputElement>) {
            return setGrants((list) => list.map((item) => item.route === route ? { route, until: e.target.value || undefined } : item));
        }
    }
    function saveOnClick3() {
        return save(`/master/pharmacies/${profile.id}/grants`, "PUT", { grants });
    }
    function renderTicket(ticket: Ticket) {
        return (<Box key={ticket.id} className={cn("!flex !items-center !gap-1.5", "!my-1.5 !mx-0")}>
            <Text as="span">{ticket.subject}</Text>
            <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold" as="span">{ticket.status}</Text>
            {ticket.status !== "Resolved" && (<Button className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={saveOnClick4}>
                Resolve
              </Button>)}
          </Box>);
        function saveOnClick4() {
            return save(`/master/pharmacies/${profile.id}/tickets/${ticket.id}`, "PATCH", {
                status: "Resolved",
            });
        }
    }
    function renderReferral(referral: Referral) {
        return (<Box key={referral.id} className={cn("!flex !items-center !gap-1.5", "!my-1.5 !mx-0")}>
            <Text as="span">{referral.name}</Text>
            <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold" as="span">{referral.status}</Text>
            <Text as="span">₹{referral.reward}</Text>
            {referral.status !== "Paid" && referral.status !== "Earned" && (<Button className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={saveOnClick5}>
                Mark earned
              </Button>)}
            {referral.status === "Earned" && (<Button className="!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={saveOnClick6}>
                Mark paid
              </Button>)}
            {referral.paidBy && <Text className="!text-muted" as="span">Paid by {referral.paidBy}</Text>}
          </Box>);
        function saveOnClick5() {
            return save(`/master/pharmacies/${profile.id}/referrals/${referral.id}/earn`, "POST", {});
        }
        function saveOnClick6() {
            return save(`/master/pharmacies/${profile.id}/referrals/${referral.id}/pay`, "POST", {});
        }
    }
}
