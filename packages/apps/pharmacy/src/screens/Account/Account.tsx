import { Box, Button, Heading, Image, Progress, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import { download } from "@/screens/Account/utils/download";
import { BankCard } from "@/screens/Account/components/BankCard";
import { Ring } from "@/screens/Account/components/Ring";
import { usePharma } from "@/hooks";
import { PLANS, planPrice, cycleNoun, inr, computeInvoice, routeLocked, PREMIUM_ROUTES, HOSPITAL_ROUTES, includedSeats, seatCeiling, UserRole, } from "@/utils";
import type { Route } from "@/types";
import { IconUsers, IconReceipt, IconCrown, IconGift, IconShare, IconHelp, IconSettings, IconCheck, IconArrowRight, IconRupee, IconShield, IconWallet, IconAlert, IconDownload, IconLock, IconSparkle, } from "@/components/Icon";
const ROLE_PILL: Record<string, string> = {
    Owner: "!bg-amber-bg !text-gold-d",
    Manager: "!bg-blue-bg !text-blue",
    Pharmacist: "!bg-wash !text-mid",
    Cashier: "!bg-teal-bg !text-teal",
};
export default function AccountScreen() {
    const { profile, subscription, grants, extraSeats, businessType, users, sales, inventory, bankAccount, go, startSetup, signOut, } = usePharma();
    const openBank = () => document.getElementById("!rounded-md !border !border-line !bg-paper !p-4")?.scrollIntoView({ behavior: "smooth", block: "center" });
    const plan = PLANS.find((p) => p.key === subscription.plan)!;
    const isFree = subscription.plan === "Essential";
    // ── metrics ──
    const activeUsers = users.filter((u) => u.active).length;
    const included = includedSeats(subscription.plan);
    const seatLimit = seatCeiling(subscription.plan, extraSeats);
    const seatPct = seatLimit == null
        ? Math.min(100, activeUsers * 10)
        : Math.min(100, Math.round((activeUsers / Math.max(1, seatLimit)) * 100));
    const invoices = sales.filter((s) => s.status !== "cancelled");
    const revenue = invoices.reduce((a, s) => a + computeInvoice(s.items, s.discount).payable, 0);
    const visiblePremium = PREMIUM_ROUTES.filter((route) => businessType === "hospital" || !HOSPITAL_ROUTES.includes(route));
    const premiumUnlocked = visiblePremium.filter((route) => !routeLocked(route, subscription, { grants, businessType })).length;
    const roleCount = users.reduce<Record<string, number>>((m, u) => {
        m[u.role] = (m[u.role] || 0) + 1;
        return m;
    }, {});
    const roleMax = Math.max(1, ...Object.values(roleCount));
    // ── profile completeness ──
    const checklist = [
        { label: "Brand logo", ok: !!profile.logo, go: () => go("invoicing") },
        { label: "Signature", ok: !!profile.signature, go: () => go("settings") },
        { label: "GSTIN", ok: !!profile.gstin, go: () => go("settings") },
        { label: "PAN", ok: !!profile.pan, go: () => go("settings") },
        { label: "Drug licence", ok: !!profile.dlNo, go: () => go("settings") },
        { label: "FSSAI licence", ok: !!profile.fssai, go: () => go("settings") },
        { label: "Trade licence", ok: !!profile.tradeNo, go: () => go("settings") },
        { label: "Business email", ok: !!profile.email, go: () => go("settings") },
        { label: "Bank account", ok: !!bankAccount, go: openBank },
    ];
    const done = checklist.filter((c) => c.ok).length;
    const pct = Math.round((done / checklist.length) * 100);
    const pending = checklist.filter((c) => !c.ok);
    // ── KYC ──
    const kyc = [
        { label: "GSTIN", val: profile.gstin || "—", ok: !!profile.gstin },
        { label: "PAN", val: profile.pan || "—", ok: !!profile.pan },
        { label: "Drug Licence (D.L.)", val: profile.dlNo || "—", ok: !!profile.dlNo },
        { label: "FSSAI licence", val: profile.fssai || "—", ok: !!profile.fssai },
        { label: "Trade licence", val: profile.tradeNo || "—", ok: !!profile.tradeNo },
        {
            label: "Registered pharmacist",
            val: profile.pharmacist.split(",")[0],
            ok: !!profile.pharmacist,
        },
        {
            label: "e-Invoicing",
            val: profile.eInvoicing ? "Enabled" : "Not enabled",
            ok: profile.eInvoicing,
        },
        {
            label: "Bank account (payouts)",
            val: bankAccount
                ? `${bankAccount.bankName} ····${bankAccount.accountNumber.slice(-4)}`
                : "Add to receive payouts",
            ok: !!bankAccount,
            bank: true,
        },
    ];
    const links: {
        key: Route;
        label: string;
        sub: string;
        Icon: (p: {
            size?: number;
        }) => React.ReactNode;
    }[] = [
        { key: "users", label: "Manage Users", sub: `${users.length} team members`, Icon: IconUsers },
        {
            key: "invoicing",
            label: "Invoice Settings",
            sub: "Templates, logo & stamp",
            Icon: IconReceipt,
        },
        {
            key: "subscription",
            label: "Subscription",
            sub: isFree
                ? "Essential · upgrade anytime"
                : `${subscription.plan} · renews ${subscription.renewsOn}`,
            Icon: IconCrown,
        },
        { key: "ca", label: "CA / Accountant", sub: "Share reports", Icon: IconShare },
        { key: "refer", label: "Refer & Earn", sub: "Invite & earn ₹500", Icon: IconGift },
        { key: "settings", label: "Pharmacy Profile", sub: "Licences & GSTIN", Icon: IconSettings },
        { key: "support", label: "Help & Support", sub: "FAQs & tickets", Icon: IconHelp },
    ];
    const exportAccount = () => {
        const data = {
            business: {
                name: profile.name,
                address: profile.address,
                gstin: profile.gstin,
                pan: profile.pan,
                dlNo: profile.dlNo,
                fssai: profile.fssai,
                tradeNo: profile.tradeNo,
                phone: profile.phone,
                email: profile.email,
                pharmacist: profile.pharmacist,
            },
            plan: {
                plan: subscription.plan,
                cycle: subscription.cycle,
                status: subscription.status,
                since: subscription.since,
                renewsOn: subscription.renewsOn,
            },
            usage: {
                teamMembers: users.length,
                activeUsers,
                invoices: invoices.length,
                lifetimeSales: Math.round(revenue),
                catalogueSkus: inventory.length,
                profileCompletePct: pct,
            },
            bankAccount: bankAccount
                ? { bankName: bankAccount.bankName, ifsc: bankAccount.ifsc, verified: bankAccount.verified }
                : null,
        };
        download(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "account-summary.json");
    };
    return (<Box className="!mx-auto !max-w-[1680px]">
      {/* business header */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-4 !flex !gap-4 !items-center !flex-wrap")}>
        <Text className="!grid !h-12 !w-12 !place-items-center !rounded-full !bg-wash !font-display !text-lg !font-extrabold !text-mid" as="span">
          {profile.logo ? <Image src={profile.logo} alt=""/> : profile.name[0]}
        </Text>
        <Box className={cn("!flex-1 !min-w-[200px]")}>
          <Heading className={cn("!text-[20px]")} level={2}>{profile.name}</Heading>
          <Text className={cn("!text-muted", "!text-[13px]")}>
            {profile.address}
          </Text>
          <Box className={cn("!flex !items-center !gap-1.5", "!mt-1.5 !flex-wrap")}>
            <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
              <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              Active
            </Text>
            <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${isFree ?"!bg-gray-pill !text-muted" :"!bg-amber-bg !text-gold-d"}`} as="span">
              <IconCrown size={12}/> {subscription.plan} plan
            </Text>
            {profile.businessTypes?.[0] && (<Text className="!inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2" as="span">{profile.businessTypes[0]}</Text>)}
            <Text className="!inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2" as="span">Member since {subscription.since}</Text>
          </Box>
        </Box>
        <Box className="!flex !items-center !gap-1.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={startSetup}>
            <IconSettings size={14}/> Run setup
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={goOnClick}>
            Edit profile
          </Button>
        </Box>
      </Box>

      {/* KPI overview */}
      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid" role="button" tabIndex={0} onClick={goOnClick2}>
          <Text className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" as="span">
            <IconArrowRight size={16}/>
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconCrown size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Plan</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{subscription.plan}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">{isFree ? "free forever" : subscription.status}</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm !cursor-pointer !transition hover:!-translate-y-0.5 hover:!border-line-2 hover:!shadow-card focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-mid" role="button" tabIndex={0} onClick={goOnClick3}>
          <Text className="pointer-events-none absolute top-[15px] right-[15px] -translate-x-[3px] text-faint opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100" as="span">
            <IconArrowRight size={16}/>
          </Text>
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconUsers size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Team members</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{users.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">{activeUsers} active</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconWallet size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Seats used</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
            {activeUsers} / {seatLimit == null ? "∞" : seatLimit}
          </Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {included == null ? "Unlimited" : `${included} included`}
            {extraSeats ? ` + ${extraSeats} extra` : ""}
          </Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-teal-bg !text-teal">
            <IconReceipt size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Invoices</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{invoices.length}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">all time</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconRupee size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Lifetime sales</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(revenue)}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">{inventory.length} SKUs</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
            <IconShield size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Profile complete</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{pct}%</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
            {done}/{checklist.length} done
          </Box>
        </Box>
      </Box>

      {/* plan + completeness */}
      <Box className={cn("!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1", "!mt-4")}>
        {/* plan & usage */}
        <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!border-mint")}>
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Plan &amp; usage</Heading>
            <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${isFree ?"!bg-gray-pill !text-muted" :"!bg-wash !text-mid"}`} as="span">
              <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              {subscription.status}
            </Text>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !items-baseline")}>
              <Box>
                <Box className={cn("!font-display !font-extrabold !text-[24px] !text-dark")}>
                  {plan.name}
                </Box>
                <Box className={cn("!text-muted", "!text-[12.5px]")}>
                  {plan.seats} ·{" "}
                  {isFree
            ? "free forever"
            : `${inr(planPrice(plan, subscription.cycle))}/${cycleNoun(subscription.cycle)}`}
                </Box>
              </Box>
              <Button className={`!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs ${isFree ? "!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" : "!border-transparent !bg-gold !text-deep hover:!brightness-95"}`} onClick={goOnClick4}>
                {isFree ? (<>
                    <IconSparkle size={13}/> Upgrade
                  </>) : (<>
                    Manage <IconArrowRight size={14}/>
                  </>)}
              </Button>
            </Box>
            {/* seats */}
            <Box className="!mt-3">
              <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !text-[12.5px] !mb-1")}>
                <Text className="!text-muted" as="span">Team seats</Text>
                <Text as="span" className="font-bold">
                  {activeUsers} / {seatLimit == null ? "∞" : seatLimit}
                </Text>
              </Box>
              <Progress className="h-2.5 rounded-[6px]" value={seatPct} tone="mid" label="Team seats" />
            </Box>
            {/* premium modules */}
            <Box className="!mt-3">
              <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !text-[12.5px] !mb-1")}>
                <Text className="!text-muted" as="span">Premium modules</Text>
                <Text as="span" className="font-bold">
                  {premiumUnlocked} / {visiblePremium.length} unlocked
                </Text>
              </Box>
              <Progress className="h-2.5 rounded-[6px]" value={visiblePremium.length ? (premiumUnlocked / visiblePremium.length) * 100 : 0} tone="mid" label="Premium modules" />
            </Box>
            {isFree ? (<Box className="!h-2 !overflow-hidden !rounded-full !bg-wash">
                <IconLock size={13}/> Billing / POS, Inventory &amp; Purchases are free.{" "}
                <Text as="span" onClick={goOnClick5} className={cn("font-bold", "!cursor-pointer !text-gold-d")}>
                  Upgrade
                </Text>{" "}
                to unlock the rest.
              </Box>) : (<Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mt-3 !pt-3 !border-t !border-line-2 !border-dashed !text-[13px]")}>
                <Text className="!text-muted" as="span">Renews on</Text>
                <Text as="span" className="font-bold">{subscription.renewsOn}</Text>
              </Box>)}
          </Box>
        </Box>

        {/* profile completeness */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Profile completeness</Heading>
            <Text className={cn("!text-muted", "!text-[12px]")} as="span">
              {done} of {checklist.length}
            </Text>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className="!text-[12.5px] !font-bold !text-mid">
              <Ring pct={pct}/>
              <Box className={cn("!flex-1")}>
                {pending.length === 0 ? (<Box className="!text-[12px] !text-muted">
                    <IconCheck size={14}/> All set — your profile is complete.
                  </Box>) : (<>
                    <Box className={cn("!text-[12.5px] !text-muted !mb-2")}>
                      Finish these to look professional on invoices &amp; get payouts:
                    </Box>
                    <Box className="!flex !flex-col !gap-2">
                      {pending.slice(0, 5).map(renderC)}
                    </Box>
                  </>)}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* KYC + team */}
      <Box className={cn("!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1", "!mt-4")}>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Business verification</Heading>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={goOnClick6}>
              Update
            </Button>
          </Box>
          <Box className={cn("!flex-1 !p-[18px]", "!pt-1")}>
            {kyc.map(renderKyc)}
          </Box>
        </Box>

        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Team</Heading>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={goOnClick7}>
              Manage <IconArrowRight size={13}/>
            </Button>
          </Box>
          <Box className="!flex-1 !p-[18px]">
            <Box className={cn("!flex !items-center !gap-2.5", "!gap-3.5 !mb-3.5")}>
              <Box>
                <Box className={cn("!font-display !font-extrabold !text-[26px] !text-dark")}>
                  {users.length}
                </Box>
                <Box className={cn("!text-muted", "!text-[12px]")}>
                  members · {activeUsers} active
                </Box>
              </Box>
            </Box>
            {(["Owner", "Manager", "Pharmacist", "Cashier"] as UserRole[])
            .filter(matchR)
            .map(renderR)}
          </Box>
        </Box>
      </Box>

      <BankCard />

      {/* quick links */}
      <Box className={cn("!mb-2 !flex !items-center !justify-between", "!mt-5.5 !mx-0 !mb-3")}>
        <Heading className={cn("!text-[16px]")} level={2}>Account settings</Heading>
      </Box>
      <Box className={cn("!grid !grid-cols-[repeat(auto-fill,minmax(280px,1fr))] !gap-3.5", "!gap-3.5")}>
        {links.map(renderLink)}
      </Box>

      {/* utilities */}
      <Box className="!mt-[22px] !flex !flex-wrap !items-center !gap-2.5 !border-t !border-line !pt-4">
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={exportAccount}>
          <IconDownload size={14}/> Export account summary
        </Button>
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={goOnClick9}>
          <IconHelp size={14}/> Contact support
        </Button>
        <Box className="!flex-1"/>
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 hover:!border-mid hover:!text-mid !border-[#f0c4c4] !text-rose hover:!border-rose hover:!bg-rose-bg hover:!text-rose" onClick={signOut}>
          Sign out
        </Button>
      </Box>
    </Box>);
    function goOnClick() {
        return go("settings");
    }
    function goOnClick2() {
        return go("subscription");
    }
    function goOnClick3() {
        return go("users");
    }
    function goOnClick4() {
        return go("subscription");
    }
    function goOnClick5() {
        return go("subscription");
    }
    function renderC(c: {
        label: string;
        ok: boolean;
        go: () => void;
    }) {
        return (<Button key={c.label} className="!flex !items-center !gap-2 !text-[13px]" onClick={c.go}>
                          <IconAlert size={12}/> {c.label} <IconArrowRight size={12}/>
                        </Button>);
    }
    function goOnClick6() {
        return go("settings");
    }
    function renderKyc(k: {
        label: string;
        val: string;
        ok: boolean;
        bank?: undefined;
    } | {
        label: string;
        val: string;
        ok: boolean;
        bank: boolean;
    }) {
        return (<Box key={k.label} className={cn("!flex !items-center !gap-2.5", "!justify-between !py-[9px] !px-0 !border-b !border-line")}>
                <Box>
                  <Box className={cn("!font-semibold !text-[13px]")}>{k.label}</Box>
                  <Box className={cn("!text-muted !font-mono", "!text-[11px]")}>
                    {k.val}
                  </Box>
                </Box>
                {k.ok ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
                    <IconCheck size={12}/> Done
                  </Text>) : (<Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={openBankOnClick}>
                    Add
                  </Button>)}
              </Box>);
        function openBankOnClick() {
            return ("bank" in k && k.bank ? openBank() : go("settings"));
        }
    }
    function goOnClick7() {
        return go("users");
    }
    function renderR(r: UserRole) {
        return (<Box key={r} className={cn("!mb-[9px]")}>
                  <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !text-[12.5px] !mb-[3px]")}>
                    <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${ROLE_PILL[r]}`} as="span">{r}</Text>
                    <Text as="span" className="font-bold">{roleCount[r]}</Text>
                  </Box>
                  <Progress className="!h-2 !rounded-[5px]" value={roleMax ? (roleCount[r] / roleMax) * 100 : 0} label={r}/>
                </Box>);
    }
    function matchR(r: UserRole) {
        return roleCount[r];
    }
    function renderLink(l: {
        key: Route;
        label: string;
        sub: string;
        Icon: (p: {
            size?: number;
        }) => React.ReactNode;
    }) {
        return (<Button key={l.key} onClick={goOnClick8} className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!text-left !flex !gap-3 !items-center")}>
            <Text className={cn("!w-10 !h-10 !rounded-[10px] !bg-wash !text-mid !grid !place-items-center !shrink-0")} as="span">
              <l.Icon size={20}/>
            </Text>
            <Text className={cn("!flex-1")} as="span">
              <Text className={cn("!font-bold !text-[13.5px] !block")} as="span">{l.label}</Text>
              <Text className={cn("!text-muted", "!text-[12px]")} as="span">
                {l.sub}
              </Text>
            </Text>
            <IconArrowRight size={16}/>
          </Button>);
        function goOnClick8() {
            return go(l.key);
        }
    }
    function goOnClick9() {
        return go("support");
    }
}
