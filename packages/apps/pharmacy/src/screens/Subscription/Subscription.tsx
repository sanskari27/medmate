import type { PlanInfo, SubRequest } from "@/utils";
import {
  Box,
  Button,
  Heading,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, KeyboardEvent } from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector, useConfirmedDispatch } from "@/hooks";
import { redeemCoupon, requestPlan, toggleAutoRenew } from "@/store/thunks/auth.thunk";
import { previewCoupon } from "@/store/thunks/master.thunk";
import {
  PLANS,
  Plan,
  BillingCycle,
  inr,
  planPrice,
  annualSavings,
  annualPerMonth,
  annualOff,
  cycleNoun,
  GST_RATE,
  subscriptionLapsed,
} from "@/utils";
import { IconCheck, IconCrown, IconStar } from "@/components/atoms";
import { subscriptionStatusLabel } from "./Subscription.utils";
type CouponOffer = {
  code: string;
  plan: Plan;
  expiresOn: string;
  validDays: number;
  expired: boolean;
  renewsOn: string;
};
export default function SubscriptionScreen() {
  const confirm = useConfirmedDispatch();
  const subscription = useAppSelector((state) => state.auth.subscription);
  const subscriptionRequests = useAppSelector((state) => state.auth.subscriptionRequests);
  const couponRedeemed = useAppSelector((state) => state.auth.couponRedeemed);
  const current = PLANS.find((p) => p.key === subscription.plan)!;
  const [cycle, setCycle] = useState<BillingCycle>(subscription.cycle);
  const curPrice = planPrice(current, subscription.cycle);
  const isFree = subscription.plan === "Essential";
  const lapsed = subscriptionLapsed(subscription);
  const statusLabel = subscriptionStatusLabel(lapsed, subscription.status);
  function toggleRenewal() {
    void confirm(toggleAutoRenew(), { kind: "edit" });
  }
  function redeem(code: string) {
    return confirm(redeemCoupon(code));
  }
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      {/* status banner */}
      <Box className="mb-[18px] flex flex-row items-center gap-4 rounded-md border border-line bg-gradient-to-r from-wash to-paper p-[18px] shadow-sm">
        <Text
          className={cn(
            "!w-[50px] !h-[50px] !rounded-[14px] !text-paper !grid !place-items-center",
            isFree
              ? "!bg-gradient-to-br from-green to-mid"
              : "!bg-gradient-to-br from-gold to-gold-d",
          )}
          as="span"
        >
          {isFree ? <IconCheck size={26} /> : <IconCrown size={26} />}
        </Text>
        <Box className={cn("!flex-1")}>
          <Box className="!flex !items-center !gap-1.5">
            <Heading className={cn("!text-[17px]")} level={3}>
              {current.name} plan
            </Heading>
            <Text
              className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${lapsed ? "!bg-rose-bg !text-rose" : "!bg-wash !text-mid"}`}
              as="span"
            >
              <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
              {statusLabel}
            </Text>
            {!isFree && (
              <Text
                className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted"
                as="span"
              >
                {subscription.cycle === "annual" ? "Annual billing" : "Monthly billing"}
              </Text>
            )}
          </Box>
          {isFree ? (
            <Text className={cn("!text-muted", "!text-[13px]")}>
              Core billing free forever · {current.seats} · Billing / POS, Inventory &amp; Purchases
              included. Upgrade to unlock the premium modules below.
            </Text>
          ) : (
            <Text className={cn("!text-muted", "!text-[13px]")}>
              {inr(curPrice)}/{cycleNoun(subscription.cycle)} · {current.seats} · renews on{" "}
              <Text as="span" className="font-bold">
                {subscription.renewsOn}
              </Text>
              {subscription.cycle === "annual" && (
                <>
                  {" "}
                  ·{" "}
                  <Text className={cn("!text-green !font-bold")} as="span">
                    saving {inr(annualSavings(current))}/yr
                  </Text>
                </>
              )}
            </Text>
          )}
        </Box>
        <Box className="!flex !items-center !gap-1.5">
          {isFree ? (
            <Button
              className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
              onClick={getElementByIdOnClick}
            >
              <IconCrown size={14} /> View plans
            </Button>
          ) : null}
        </Box>
      </Box>

      {!isFree && (
        <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-4.5 !py-0 !px-1")}>
          <Box>
            <Text className={cn("!font-bold !text-[13.5px]")} as="span">
              Auto-renew
            </Text>
            <Box className={cn("!text-muted", "!text-[12px]")}>
              Saved preference only. It does not charge a card or keep paid screens open after the
              renewal date.
            </Box>
          </Box>
          <Switch
            checked={subscription.autoRenew}
            label="Auto-renew"
            onClick={toggleRenewal}
            className="origin-center scale-110"
          />
        </Box>
      )}

      {/* plan comparison + cycle toggle */}
      <Box className="mb-0 flex items-center justify-between">
        <Heading className={cn("!text-[16px]")} level={2}>
          Plans
        </Heading>
        <Text className="text-[12.5px] text-muted" as="span">
          switch anytime · prices exclude {Math.round(GST_RATE * 100)}% GST
        </Text>
      </Box>
      <Box className="mx-0 mt-3 mb-[18px] flex items-center justify-center gap-2.5">
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          <Button
            className={
              cycle === "monthly"
                ? "!rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper hover:!text-dark active:!translate-y-0"
                : "!rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted active:!translate-y-0"
            }
            onClick={setCycleOnClick}
          >
            Monthly
          </Button>
          <Button
            className={
              cycle === "annual"
                ? "!rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper hover:!text-dark active:!translate-y-0"
                : "!rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted active:!translate-y-0"
            }
            onClick={setCycleOnClick2}
          >
            Annual{" "}
            <Text
              className="ml-1 inline-flex items-center gap-1 rounded-full bg-wash px-[9px] py-[3px] text-[11px] [line-height:14px] font-bold whitespace-nowrap text-mid"
              as="span"
            >
              save up to {Math.max(...PLANS.map(annualOff))}%
            </Text>
          </Button>
        </Box>
      </Box>

      <Box
        id="pd-plans"
        className="mb-[18px] grid grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))] gap-[14px] pt-3"
      >
        {PLANS.map(renderPLANS)}
      </Box>
      {!couponRedeemed && <CouponRedeem onRedeem={redeem} />}
      <Text className={cn("!text-muted", "!text-[12.5px]")}>
        Online payment is not connected. A request goes to Namma MedMate, who assigns the plan.
      </Text>
      {subscriptionRequests.length > 0 && (
        <Box
          className={cn(
            "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm",
            "!mt-4",
          )}
        >
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>Your requests</Heading>
          </Box>
          <Box className="!overflow-x-auto">
            <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Plan</TableHeaderCell>
                  <TableHeaderCell>Cycle</TableHeaderCell>
                  <TableHeaderCell>Kind</TableHeaderCell>
                  <TableHeaderCell>Sent</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>{subscriptionRequests.map(renderSubscriptionRequest)}</TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Box>
  );
  function getElementByIdOnClick() {
    const el = document.getElementById("pd-plans");
    el?.scrollIntoView({ behavior: "smooth" });
  }
  function setCycleOnClick() {
    return setCycle("monthly");
  }
  function setCycleOnClick2() {
    return setCycle("annual");
  }
  function renderPLANS(p: PlanInfo) {
    const isCurrent =
      p.key === subscription.plan && (p.key === "Essential" || cycle === subscription.cycle);
    const free = p.key === "Essential";
    const price = planPrice(p, cycle);
    return (
      <Box
        key={p.key}
        className={cn(
          "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
          "!relative",
          isCurrent ? "!border-mid" : "!border-line",
          isCurrent ? "!border-2" : "!border",
        )}
      >
        {p.key === "Growth" && (
          <Text
            className="absolute -top-2.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-amber-bg px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap text-gold-d"
            as="span"
          >
            <IconStar size={13} /> Popular
          </Text>
        )}
        {free && (
          <Text
            className="absolute -top-2.5 right-3.5 inline-flex items-center gap-1 rounded-full bg-wash px-[9px] py-[3px] text-[11px] font-bold whitespace-nowrap text-mid"
            as="span"
          >
            <IconCheck size={12} /> Free forever
          </Text>
        )}
        <Box className={cn("!font-display !font-extrabold !text-[18px] !text-dark")}>{p.name}</Box>
        <Box className={cn("!text-muted", "!text-[12px]")}>{p.tagline}</Box>
        <Box className={cn("!mt-2.5 !mx-0 !mb-0.5")}>
          <Text className={cn("!font-display !font-extrabold !text-[28px] !text-dark")} as="span">
            {free ? "₹0" : inr(price)}
          </Text>
          {!free && (
            <Text className={cn("!text-muted", "!text-[13px]")} as="span">
              /{cycleNoun(cycle)}
            </Text>
          )}
        </Box>
        {free ? (
          <Box className={cn("!text-muted", "!text-[11.5px] !mb-3")}>no card · no expiry</Box>
        ) : cycle === "annual" ? (
          <Box className={cn("!text-[11.5px] !mb-3")}>
            <Text
              className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid"
              as="span"
            >
              {annualOff(p)}% off
            </Text>{" "}
            <Text className="!text-muted" as="span">
              {inr(annualPerMonth(p))}/mo · save {inr(annualSavings(p))}
            </Text>
          </Box>
        ) : (
          <Box className={cn("!text-muted", "!text-[11.5px] !mb-3")}>
            or {inr(annualPerMonth(p))}/mo billed yearly (save {annualOff(p)}%)
          </Box>
        )}
        <Box className="mb-[14px] flex flex-col text-[12.5px]">{p.features.map(renderFeature)}</Box>
        {isCurrent && free ? (
          <Button variant="ghost" block className="mt-auto" disabled>
            Current plan
          </Button>
        ) : (
          <Button variant="ghost" block className="mt-auto" onClick={requestPlanOnClick}>
            {isCurrent ? "Request renewal" : `Request ${p.name}`}
          </Button>
        )}
      </Box>
    );
    function renderFeature(f: string) {
      return (
        <Box key={f} className="flex min-h-[26px] items-start gap-1.5 px-0 py-[3px] text-[12.5px]">
          <Text className="mt-px text-green" as="span">
            <IconCheck size={13} />
          </Text>
          <Text as="span" className="text-[12.5px] [line-height:1.5]">
            {f}
          </Text>
        </Box>
      );
    }
    function requestPlanOnClick() {
      void confirm(
        requestPlan({
          plan: p.key,
          cycle: free ? "monthly" : cycle,
          kind: isCurrent ? "renewal" : "plan",
        }),
      );
    }
  }
  function renderSubscriptionRequest(request: SubRequest) {
    return (
      <TableRow key={request.id}>
        <TableCell>{request.plan}</TableCell>
        <TableCell>{request.cycle}</TableCell>
        <TableCell>{request.kind}</TableCell>
        <TableCell>{new Date(request.createdAt).toLocaleString()}</TableCell>
        <TableCell>{request.status}</TableCell>
      </TableRow>
    );
  }
}
function CouponRedeem({ onRedeem }: { onRedeem: (code: string) => Promise<unknown> }) {
  const dispatch = useAppDispatch();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [offer, setOffer] = useState<CouponOffer | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const check = async () => {
    setError("");
    setOffer(null);
    setBusy(true);
    try {
      setOffer(await dispatch(previewCoupon(code)).unwrap());
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not check that code");
    } finally {
      setBusy(false);
    }
  };
  const plan = offer ? PLANS.find((item) => item.key === offer.plan) : undefined;
  return (
    <Box className={cn("!mt-5.5")}>
      <Box
        className={cn("!flex !items-center !gap-2.5", "!items-center !gap-3 !mt-1 !mx-0 !mb-3.5")}
      >
        <Text className={cn("!flex-1 !h-px !bg-line")} as="span" />
        <Text className={cn("!text-muted", "!text-[12px] !font-bold !tracking-[.04em]")} as="span">
          or
        </Text>
        <Text className={cn("!flex-1 !h-px !bg-line")} as="span" />
      </Box>
      {!open ? (
        <Text className={cn("!text-center !text-[14px]")}>
          Have a coupon code?{" "}
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs"
            onClick={setOpenOnClick}
          >
            Redeem now
          </Button>
        </Text>
      ) : (
        <Box
          className={cn(
            "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
            "!max-w-[480px] !mx-auto !my-0",
          )}
        >
          <Heading className={cn("!text-[15px] !mb-2")} level={3}>
            Have a coupon code?
          </Heading>
          <Text className={cn("!text-muted", "!text-[12.5px] !mb-3")}>
            One coupon per pharmacy. Check it before you redeem.
          </Text>
          <Box className={cn("!flex !items-center !gap-1.5", "!items-end")}>
            <Box
              className={cn(
                "!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2",
                "!flex-1",
              )}
            >
              <Label htmlFor="coupon-code">Coupon code</Label>
              <Input
                id="coupon-code"
                className=""
                data-field="code"
                value={code}
                autoComplete="off"
                aria-invalid={Boolean(error)}
                onChange={setCodeOnChange}
                onKeyDown={checkOnKeyDown}
              />
            </Box>
            <Button
              className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
              disabled={busy || code.trim().length < 4}
              onClick={checkOnClick}
            >
              Check
            </Button>
          </Box>
          {error && (
            <Text
              role="alert"
              className={cn(
                "!mb-3 !rounded-sm !border !border-[#f3c0c0] !bg-rose-bg !px-3 !py-2.5 !text-[13px] !font-bold !text-rose",
                "!mt-3",
              )}
            >
              {error}
            </Text>
          )}
          {offer && plan && (
            <Box className={cn("!mt-3.5")}>
              <Box className={cn("!font-display !font-extrabold !text-[18px]")}>
                {plan.name} plan
              </Box>
              <Text className={cn("!text-muted", "!text-[13px] !mt-1 !mx-0 !mb-2.5")}>
                Active for {offer.validDays} days, until{" "}
                <Text as="span" className="font-bold">
                  {offer.renewsOn}
                </Text>
                . Code expires{" "}
                <Text as="span" className="font-bold">
                  {offer.expiresOn}
                </Text>
                .
              </Text>
              {offer.expired ? (
                <Text
                  className="!mb-3 !rounded-sm !border !border-[#f3c0c0] !bg-rose-bg !px-3 !py-2.5 !text-[13px] !font-bold !text-rose"
                  role="alert"
                >
                  This coupon has expired.
                </Text>
              ) : (
                <Button
                  className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
                  disabled={busy}
                  onClick={setBusyOnClick}
                >
                  Redeem
                </Button>
              )}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
  function setOpenOnClick() {
    return setOpen(true);
  }
  function setCodeOnChange(e: ChangeEvent<HTMLInputElement>) {
    setCode(e.target.value.toUpperCase());
    setOffer(null);
    setError("");
  }
  function checkOnKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") void check();
  }
  function checkOnClick() {
    return void check();
  }
  function setBusyOnClick() {
    setBusy(true);
    if (!offer) return;
    void onRedeem(offer.code).finally(() => setBusy(false));
  }
}
