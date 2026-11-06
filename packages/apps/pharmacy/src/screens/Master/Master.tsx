import type { MasterProps } from "./Master.types";
import { Box, Button, Heading, Text } from "@/components/atoms";
import { BrandMark } from "@/components/molecules/BrandMark";
import { IconLogout, IconMenu } from "@/components/atoms";
import { cn } from "@/utils/className";
import { plusDays } from "@/utils/date";
import { subOf } from "@/screens/Master/utils/subOf";
import { renewalDue } from "@/screens/Master/utils/renewalDue";
import { kycGaps } from "@/screens/Master/utils/kycGaps";
import { seatText } from "@/screens/Master/utils/seatText";
import { Dashboard } from "@/screens/Master/components/Dashboard";
import { PharmacyList } from "@/screens/Master/components/PharmacyList";
import { Queue } from "@/screens/Master/components/Queue";
import { RequestTable } from "@/screens/Master/components/RequestTable";
import { ConsultationTable } from "@/screens/Master/components/ConsultationTable";
import { TicketTable } from "@/screens/Master/components/TicketTable";
import { ReferralTable } from "@/screens/Master/components/ReferralTable";
import { AuditTable } from "@/screens/Master/components/AuditTable";
import { PharmacyFile } from "@/screens/Master/components/PharmacyFile";
import { CouponDesk } from "@/screens/Master/components/CouponDesk";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { clearMasterProfile } from "@/store/slices/master.slice";
import {
  impersonatePharmacy,
  loadMasterAudit,
  loadMasterDesk,
  markConsultationHandled,
  masterSignOut,
  openMasterPharmacy,
  saveMasterChange,
} from "@/store/thunks/master.thunk";
import { BillingCycle, Plan, subscriptionLapsed, todayISO } from "@/utils";
import {
  IconChevronLeft,
  IconCrown,
  IconDashboard,
  IconGift,
  IconHelp,
  IconOffer,
  IconReports,
  IconRx,
  IconSend,
  IconStore,
  IconUser,
} from "@/components/atoms";
import { SignOutDialog } from "@/layouts/AuthLayout/components/SignOutDialog";
type Desk =
  | "dashboard"
  | "pharmacies"
  | "kyc"
  | "subscriptions"
  | "coupons"
  | "requests"
  | "support"
  | "consultations"
  | "referrals"
  | "activity";
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
type RequestRow = {
  id: string;
  pharmacyId: string;
  pharmacyName: string;
  phone: string;
  plan: Plan;
  cycle: BillingCycle;
  kind: string;
  createdAt: number;
  status: string;
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
const NAV: {
  key: Desk;
  label: string;
  group?: string;
  Icon: (p: { size?: number }) => React.ReactNode;
}[] = [
  { key: "dashboard", label: "Dashboard", Icon: IconDashboard },
  { key: "pharmacies", label: "Pharmacies", Icon: IconStore, group: "Tenants" },
  { key: "kyc", label: "KYC", Icon: IconUser },
  { key: "subscriptions", label: "Subscriptions", Icon: IconCrown },
  { key: "coupons", label: "Coupons", Icon: IconOffer },
  { key: "requests", label: "Plan requests", Icon: IconSend },
  { key: "support", label: "Support", Icon: IconHelp, group: "Operations" },
  { key: "consultations", label: "Consultations", Icon: IconRx },
  { key: "referrals", label: "Referrals", Icon: IconGift },
  { key: "activity", label: "Platform activity", Icon: IconReports },
];
const META: Record<
  Desk,
  {
    title: string;
    sub: string;
  }
> = {
  dashboard: { title: "Dashboard", sub: "Pharmacies, KYC, and renewals" },
  pharmacies: { title: "Pharmacies", sub: "Search and open a pharmacy file" },
  kyc: { title: "KYC", sub: "GSTIN, PAN, or drug licence still blank" },
  subscriptions: { title: "Subscriptions", sub: "Plan, cycle, and renewal" },
  coupons: { title: "Coupons", sub: "Upgrade codes with an expiry and a plan length" },
  requests: { title: "Plan requests", sub: "What pharmacies asked for" },
  support: { title: "Support", sub: "Open tickets" },
  consultations: { title: "Consultations", sub: "Bookings from the public site" },
  referrals: { title: "Referrals", sub: "Earn, then pay ₹500 once" },
  activity: { title: "Platform activity", sub: "Master changes, newest first" },
};
export default function MasterPortal({
  phone,
  onPharmacy,
  pharmacyLabel,
  onSignedOut,
}: MasterProps) {
  const dispatch = useAppDispatch();
  const rows = useAppSelector((state) => state.master.pharmacies);
  const requests = useAppSelector((state) => state.master.requests);
  const tickets = useAppSelector((state) => state.master.tickets);
  const referrals = useAppSelector((state) => state.master.referrals);
  const bookings = useAppSelector((state) => state.master.bookings);
  const audit = useAppSelector((state) => state.master.audit);
  const profile = useAppSelector((state) => state.master.profile);
  const [desk, setDesk] = useState<Desk>("dashboard");
  const [menu, setMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [plan, setPlan] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [window, setWindow] = useState("");
  const [reason, setReason] = useState("");
  const [renewsOn, setRenewsOn] = useState(plusDays(30));
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [nextPlan, setNextPlan] = useState<Plan>("Care");
  const [extra, setExtra] = useState(0);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [error, setError] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  useEffect(() => {
    void dispatch(loadMasterDesk())
      .unwrap()
      .catch((err: unknown) => {
        setError(typeof err === "string" ? err : "Could not load the master desk");
      });
  }, [dispatch]);
  useEffect(() => {
    if (desk !== "activity") return;
    void dispatch(loadMasterAudit())
      .unwrap()
      .catch((err: unknown) => {
        setError(typeof err === "string" ? err : "Could not load activity");
      });
  }, [desk, dispatch]);
  const choose = (key: Desk) => {
    setDesk(key);
    dispatch(clearMasterProfile());
    setMenu(false);
  };
  const open = async (
    id: string,
    patch?: {
      plan?: Plan;
      cycle?: BillingCycle;
    },
  ) => {
    try {
      const next = await dispatch(openMasterPharmacy(id)).unwrap();
      setNextPlan(patch?.plan || (next.plan as Plan));
      setCycle(patch?.cycle || (next.cycle === "annual" ? "annual" : "monthly"));
      setRenewsOn(/^\d{4}-\d{2}-\d{2}$/.test(next.renewsOn) ? next.renewsOn : plusDays(30));
      setExtra(next.seats.extra);
      setGrants(next.grants || []);
      setError("");
      setMenu(false);
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not open the pharmacy");
    }
  };
  const save = async (path: string, method: string, body: unknown, reopen = true) => {
    try {
      await dispatch(
        saveMasterChange({
          path,
          method,
          body,
          reason,
          pharmacyId: reopen && profile ? profile.id : undefined,
          refreshAudit: desk === "activity",
        }),
      ).unwrap();
      setError("");
    } catch (err) {
      setError(typeof err === "string" ? err : "Save failed");
    }
  };
  const signOut = () => setLeaveOpen(true);
  const finishSignOut = async () => {
    setLeaveOpen(false);
    await dispatch(masterSignOut());
    onSignedOut();
  };
  const filtered = rows.filter((row) => {
    const query = searchQuery.trim().toLowerCase();
    const digits = query.replace(/\D/g, "");
    if (
      query &&
      !row.name.toLowerCase().includes(query) &&
      !row.city.toLowerCase().includes(query) &&
      !(digits.length >= 4 && row.phone.replace(/\D/g, "").includes(digits))
    )
      return false;
    if (plan && row.plan !== plan) return false;
    if (businessType && row.businessType !== businessType) return false;
    const sub = subOf(row);
    if (window === "expired") return subscriptionLapsed(sub);
    if (window === "7" || window === "15" || window === "30") {
      if (subscriptionLapsed(sub) || !/^\d{4}-\d{2}-\d{2}$/.test(row.renewsOn)) return false;
      return row.renewsOn >= todayISO() && row.renewsOn <= plusDays(Number(window));
    }
    return true;
  });
  const kycQueue = rows.filter((row) => kycGaps(row).length > 0);
  const due = rows.filter(renewalDue);
  const openRequests = requests.filter((request) => request.status === "open");
  const meta = META[desk];
  const openBookings = bookings.filter((row) => row.status === "open").length;
  const badge = (key: Desk) =>
    key === "kyc"
      ? kycQueue.length
      : key === "subscriptions"
        ? due.length
        : key === "requests"
          ? openRequests.length
          : key === "support"
            ? tickets.length
            : key === "consultations"
              ? openBookings
              : 0;
  const markBooking = async (id: number) => {
    try {
      await dispatch(markConsultationHandled(id)).unwrap();
      setError("");
    } catch (err) {
      setError(typeof err === "string" ? err : "Save failed");
    }
  };
  const impersonate = async (id: string) => {
    try {
      await dispatch(impersonatePharmacy(id)).unwrap();
      globalThis.location.assign("/");
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not open the pharmacy");
    }
  };
  return (
    <Box className="!flex !h-dvh !w-full !overflow-hidden !bg-canvas">
      {menu && (
        <Button
          className="!fixed !inset-0 !z-30 !border-0 !bg-black/45"
          aria-label="Close menu"
          onClick={setMenuOnClick}
        />
      )}
      <Box
        className={`!flex !h-dvh !w-[248px] !shrink-0 !flex-col !border-r !border-black/20 !bg-gradient-to-b !from-sidebar !to-[#0c2516] !text-white max-[1099px]:!fixed max-[1099px]:!z-40 max-[1099px]:!-translate-x-[105%] max-[1099px]:!transition-transform ${menu ? " max-[1099px]:!translate-x-0" : ""}`}
      >
        <Box className="!flex !items-center !gap-2.5 !px-[18px] !pt-[18px] !pb-4">
          <BrandMark />
          <Text className="!min-w-0" as="span">
            <Text
              as="span"
              className="!block !font-display !text-[15px] !font-extrabold !tracking-[-0.01em] !text-white"
            >
              <Text as="span" className="not-italic text-gold">
                Namma
              </Text>{" "}
              MedMate
            </Text>
            <Text
              as="span"
              className="!block !text-[9px] !font-bold !tracking-[0.14em] !text-mint !uppercase"
            >
              Master
            </Text>
          </Text>
        </Box>
        <Box className="!mx-3.5 !mb-2.5 !flex !items-center !gap-2 !rounded-[10px] !border !border-white/10 !bg-white/[0.06] !px-[11px] !py-[9px]">
          <Text className={cn("!text-[18px]")} as="span">
            <IconUser size={18} />
          </Text>
          <Text className="!text-[12px] !font-bold !leading-snug !text-white" as="span">
            {phone}
            <Text as="span" className="!block !text-[10px] !font-semibold !text-mint">
              Allowlisted staff
            </Text>
          </Text>
        </Box>
        <Box
          data-slot="nav"
          className="!flex !flex-1 !flex-col !gap-0.5 !overflow-y-auto !px-3 !py-1.5"
        >
          {NAV.map(renderNAV)}
        </Box>
        <Box className="!mt-auto !border-t !border-white/[0.09] !px-3.5 !pt-3.5 !pb-4">
          <Button
            className="!relative !flex !h-auto !w-full !items-center !gap-[11px] !rounded-sm !border-0 !bg-transparent !px-3 !py-2 !text-left !text-[13px] !font-semibold !text-white/[0.66] !shadow-none hover:!bg-white/[0.07] hover:!text-white"
            onClick={onPharmacy}
          >
            <Text className="!grid !h-5 !w-5 !shrink-0 !place-items-center !opacity-80" as="span">
              <IconStore size={19} />
            </Text>
            {pharmacyLabel}
          </Button>
          <Box className="!flex !items-center !gap-2.5">
            <Text
              className="!grid !h-[34px] !w-[34px] !shrink-0 !place-items-center !rounded-[10px] !bg-mint !font-display !text-[12px] !font-extrabold !text-deep"
              as="span"
            >
              M
            </Text>
            <Text className="!text-[12.5px] !font-bold !leading-snug !text-white" as="span">
              Master
              <Text as="span" className="!block !text-[10.5px] !font-medium !text-white/45">
                {phone}
              </Text>
            </Text>
            <Button
              className="!ml-auto !grid !h-[30px] !w-[30px] !place-items-center !rounded-sm !border !border-white/15 !bg-white/5 !p-0 !text-white/70 !shadow-none hover:!border-rose/50 hover:!bg-rose/25 hover:!text-white"
              title="Log out"
              onClick={signOut}
              aria-label="Log out"
            >
              <IconLogout size={17} />
            </Button>
          </Box>
          <Text className="!px-3 !pt-2 !pb-3 !text-center !text-[10px] !tracking-[0.01em] !text-white/40">
            © 2026 Medmate India Technology Private Limited
          </Text>
        </Box>
      </Box>
      <Box className="!flex !h-dvh !min-w-0 !flex-1 !flex-col !overflow-hidden">
        <Box className="!flex !h-[60px] !shrink-0 !items-center !gap-4 !border-b !border-line !bg-paper !px-6 max-[1099px]:!gap-2.5 max-[1099px]:!px-4 max-[767px]:!h-auto max-[767px]:!flex-wrap max-[767px]:!gap-2 max-[767px]:!px-3 max-[767px]:!py-2.5">
          <Button
            className="!hidden !h-9 !w-9 !place-items-center !rounded-sm !border !border-line !bg-paper !p-0 !text-ink-2 !shadow-none hover:!border-line-2 hover:!bg-wash-2 max-[1099px]:!grid"
            onClick={setMenuOnClick2}
            aria-label="Menu"
          >
            <IconMenu size={18} />
          </Button>
          {profile && (
            <Button
              className="!grid !h-[34px] !w-[34px] !shrink-0 !place-items-center !rounded-sm !border !border-line !bg-paper !p-0 !text-ink-2 !shadow-none hover:!border-line-2 hover:!bg-wash-2 hover:!text-mid"
              onClick={setProfileOnClick}
              aria-label="Go back"
            >
              <IconChevronLeft size={19} />
            </Button>
          )}
          <Box className="!flex !min-w-0 !flex-col [&_h1]:!truncate [&_h1]:!text-[19px] [&_h1]:!font-bold ">
            <Heading level={1}>{profile ? profile.name : meta.title}</Heading>
            <Text
              as="span"
              className="text-[11px] font-semibold truncate text-[12.5px] font-medium text-muted"
            >
              {profile ? `${profile.phone} · ${profile.city || "No city"}` : meta.sub}
            </Text>
          </Box>
        </Box>
        <Box className="!min-w-0 !flex-1 !overflow-y-auto !px-6 !pt-[22px] !pb-10 max-[1099px]:!px-4 max-[1099px]:!pt-[18px] max-[1099px]:!pb-9 max-[767px]:!px-3 max-[767px]:!pt-3.5 max-[767px]:!pb-7">
          <Box className="!mx-auto !max-w-[1680px]">
            {error && (
              <Text
                className="!mb-3 !rounded-sm !border !border-[#f3c0c0] !bg-rose-bg !px-3 !py-2.5 !text-[13px] !font-bold !text-rose"
                role="alert"
              >
                {error}
              </Text>
            )}
            {profile ? (
              <PharmacyFile
                profile={profile}
                reason={reason}
                setReason={setReason}
                nextPlan={nextPlan}
                setNextPlan={setNextPlan}
                cycle={cycle}
                setCycle={setCycle}
                renewsOn={renewsOn}
                setRenewsOn={setRenewsOn}
                extra={extra}
                setExtra={setExtra}
                grants={grants}
                setGrants={setGrants}
                save={save}
                onImpersonate={impersonateOnImpersonate}
              />
            ) : (
              <>
                {desk === "dashboard" && (
                  <Dashboard
                    counts={{
                      pharmacies: rows.length,
                      kyc: kycQueue.length,
                      due: due.length,
                      requests: openRequests.length,
                      tickets: tickets.length,
                    }}
                    onOpen={choose}
                  />
                )}
                {desk === "pharmacies" && (
                  <PharmacyList
                    rows={filtered}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    plan={plan}
                    setPlan={setPlan}
                    businessType={businessType}
                    setBusinessType={setBusinessType}
                    window={window}
                    setWindow={setWindow}
                    onOpen={openOnOpen}
                  />
                )}
                {desk === "kyc" && (
                  <Queue
                    rows={kycQueue}
                    empty="Every pharmacy has a GSTIN, PAN, and drug licence."
                    columns={["Pharmacy", "Phone", "Missing"]}
                    cells={joinOnAction}
                    onOpen={openOnOpen2}
                  />
                )}
                {desk === "subscriptions" && (
                  <Queue
                    rows={rows}
                    empty="No pharmacies yet."
                    columns={["Pharmacy", "Plan", "Renews", "Seats"]}
                    cells={renewalDueOnAction}
                    onOpen={openOnOpen3}
                  />
                )}
                {desk === "coupons" && <CouponDesk />}
                {desk === "requests" && <RequestTable requests={requests} onOpen={openOnOpen4} />}
                {desk === "support" && <TicketTable tickets={tickets} onResolve={saveOnResolve} />}
                {desk === "consultations" && (
                  <ConsultationTable rows={bookings} onHandled={markBookingOnHandled} />
                )}
                {desk === "referrals" && (
                  <ReferralTable referrals={referrals} onEarn={saveOnEarn} onPay={saveOnPay} />
                )}
                {desk === "activity" && <AuditTable rows={audit} />}
              </>
            )}
          </Box>
        </Box>
      </Box>
      {leaveOpen && (
        <SignOutDialog onCancel={setLeaveOpenOnCancel} onConfirm={finishSignOutOnConfirm} />
      )}
    </Box>
  );
  function setMenuOnClick() {
    return setMenu(false);
  }
  function renderNAV(item: {
    key: Desk;
    label: string;
    group?: string;
    Icon: (p: { size?: number }) => React.ReactNode;
  }) {
    return (
      <Box key={item.key}>
        {item.group && (
          <Box className="!px-2.5 !pt-4 !pb-1.5 !text-[10px] !font-extrabold !tracking-[0.14em] !text-[rgba(143,212,168,0.48)] !uppercase">
            {item.group}
          </Box>
        )}
        <Button
          className={`!relative !flex !h-auto !w-full !items-center !gap-[11px] !rounded-sm !border-0 !bg-transparent !px-3 !py-2 !text-left !text-[13px] !font-semibold !text-white/[0.66] !shadow-none hover:!bg-white/[0.07] hover:!text-white ${desk === item.key && !profile ? " !bg-white/10 !font-bold !text-white before:!absolute before:!top-1/2 before:!left-[-12px] before:!h-[18px] before:!w-[3px] before:!-translate-y-1/2 before:!rounded-r-[3px] before:!bg-mint before:!content-['']" : ""}`}
          onClick={chooseOnClick}
        >
          <Text
            className={cn(
              "!grid !h-5 !w-5 !shrink-0 !place-items-center",
              desk === item.key && !profile ? "!opacity-100" : "!opacity-80",
            )}
            as="span"
          >
            <item.Icon size={19} />
          </Text>
          {item.label}
          {badge(item.key) > 0 && (
            <Text
              className={cn(
                "ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-[10px] px-[5px] text-[11px] font-extrabold",
                desk === item.key && !profile ? "!bg-white !text-dark" : "bg-gold text-deep",
              )}
              as="span"
            >
              {badge(item.key)}
            </Text>
          )}
        </Button>
      </Box>
    );
    function chooseOnClick() {
      return choose(item.key);
    }
  }
  function setMenuOnClick2() {
    return setMenu((open) => !open);
  }
  function setProfileOnClick() {
    dispatch(clearMasterProfile());
  }
  function impersonateOnImpersonate() {
    if (profile) return void impersonate(profile.id);
  }
  function openOnOpen(id: string) {
    return void open(id);
  }
  function joinOnAction(row: Row) {
    return [row.name, row.phone, kycGaps(row).join(", ")];
  }
  function openOnOpen2(id: string) {
    return void open(id);
  }
  function renewalDueOnAction(row: Row) {
    return [
      row.name,
      `${row.plan} · ${row.cycle}${renewalDue(row) ? " · due" : ""}`,
      row.renewsOn || "—",
      seatText(row.seats),
    ];
  }
  function openOnOpen3(id: string) {
    return void open(id);
  }
  function openOnOpen4(request: RequestRow) {
    return void open(request.pharmacyId, { plan: request.plan, cycle: request.cycle });
  }
  function saveOnResolve(ticket: Ticket) {
    return void save(
      `/master/pharmacies/${ticket.pharmacyId}/tickets/${ticket.id}`,
      "PATCH",
      { status: "Resolved" },
      false,
    );
  }
  function markBookingOnHandled(id: number) {
    return void markBooking(id);
  }
  function saveOnEarn(row: Referral) {
    return void save(
      `/master/pharmacies/${row.pharmacyId}/referrals/${row.id}/earn`,
      "POST",
      {},
      false,
    );
  }
  function saveOnPay(row: Referral) {
    return void save(
      `/master/pharmacies/${row.pharmacyId}/referrals/${row.id}/pay`,
      "POST",
      {},
      false,
    );
  }
  function setLeaveOpenOnCancel() {
    return setLeaveOpen(false);
  }
  function finishSignOutOnConfirm() {
    return void finishSignOut();
  }
}
