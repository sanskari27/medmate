import type { Referral } from "@/utils";
import {
  Box,
  Button,
  Heading,
  Input,
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
import type { ChangeEvent } from "react";
import { useState } from "react";
import { useAppDispatch, useAppSelector, useConfirmedDispatch } from "@/hooks";
import { showToast } from "@/store/actions/feedback.actions";
import { addReferral, updateReferral } from "@/store/thunks/customers.thunk";
import { inr } from "@/utils";
import { ReferralStatus } from "@/utils/calculations/referrals";
import { IconGift, IconCheck, IconSend, IconInbox, IconStore, IconCash } from "@/components/atoms";
import { earnedReferralTotal } from "./Referrals.utils";
export default function ReferScreen() {
  const dispatch = useAppDispatch();
  const confirm = useConfirmedDispatch();
  const profile = useAppSelector((state) => state.auth.profile);
  const referrals = useAppSelector((state) => state.customers.referrals);
  function toast(message: string) {
    dispatch(showToast(message));
  }
  async function saveReferral(referral: Parameters<typeof addReferral>[0]) {
    const result = await confirm(addReferral(referral));
    return "fault" in result ? result.fault : null;
  }
  function changeReferral(id: string, patch: Parameters<typeof updateReferral>[0]["patch"]) {
    void confirm(updateReferral({ id, patch }), { kind: "edit" });
  }
  const code =
    profile.name
      .replace(/[^A-Za-z]/g, "")
      .slice(0, 6)
      .toUpperCase() + "500";
  const [copied, setCopied] = useState(false);
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const earned = earnedReferralTotal(referrals);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(code);
    } catch {
      /* clipboard can be unavailable */
    }
    setCopied(true);
    toast("Referral code copied");
    setTimeout(() => setCopied(false), 1500);
  };
  const shareText = `Join Namma MedMate with my code ${code}`;
  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const steps = [
    { ic: IconInbox, t: "Share your code", s: "Send your referral code to other pharmacy owners." },
    {
      ic: IconStore,
      t: "They join Namma MedMate",
      s: "They sign up & activate any paid plan using your code.",
    },
    {
      ic: IconCash,
      t: "You both earn ₹500",
      s: "₹500 credit lands in both accounts after their first month.",
    },
  ];
  return (
    <Box className={cn("!mx-auto !max-w-[1680px]", "!max-w-[980px]")}>
      {/* hero */}
      <Box className="!mb-4 !flex !flex-row !flex-wrap !items-center !gap-5 !rounded-md !border !border-line !bg-[linear-gradient(120deg,var(--color-dark),var(--color-green))] !p-[18px] !text-paper !shadow-sm">
        <span className="inline-flex h-[81px] w-10 shrink-0 items-center text-paper">
          <IconGift size={40} />
        </span>
        <Box className={cn("!flex-1")}>
          <Heading className={cn("!text-paper !text-[24px]")} level={2}>
            Refer a pharmacy, earn {inr(500)}
          </Heading>
          <Text className="!mt-1 !text-[13.5px] !text-paper !opacity-90">
            Invite neighbouring chemists to Namma MedMate. You both get ₹500 subscription credit
            when they activate a plan.
          </Text>
        </Box>
      </Box>

      <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
        <Box>
          {/* code box */}
          <Box
            className={cn(
              "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
              "!mb-4",
            )}
          >
            <Box className={cn("!text-[12px] !font-bold !text-muted")}>YOUR REFERRAL CODE</Box>
            <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mt-2")}>
              <Text
                className={cn(
                  "!font-mono",
                  "!font-mono !text-[26px] !font-bold !tracking-[.08em] !text-dark",
                )}
                as="span"
              >
                {code}
              </Text>
              <Button
                className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
                onClick={copy}
              >
                {copied ? (
                  <>
                    <IconCheck size={15} /> Copied
                  </>
                ) : (
                  "Copy"
                )}
              </Button>
            </Box>
            <Box className={cn("!flex !items-center !gap-1.5", "!mt-3.5")}>
              <Button
                className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !w-full"
                onClick={openOnClick}
              >
                <IconSend size={15} /> WhatsApp
              </Button>
              <Button
                className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !w-full"
                onClick={openOnClick2}
              >
                Email
              </Button>
            </Box>
          </Box>

          {/* earnings */}
          <Box className="!grid !grid-cols-2 !gap-4 max-[767px]:!grid-cols-1">
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
                <IconGift size={18} />
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
                Total earned
              </Box>
              <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
                {inr(earned)}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
                referral rewards
              </Box>
            </Box>
            <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
              <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
                <IconStore size={18} />
              </Box>
              <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">
                Pharmacies referred
              </Box>
              <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">
                {referrals.length}
              </Box>
              <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
                joined via you
              </Box>
            </Box>
          </Box>
        </Box>

        {/* how it works */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
          <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
            <Heading level={3}>How it works</Heading>
          </Box>
          <Box className="!flex-1 !p-[18px]">{steps.map(renderStep)}</Box>
        </Box>
      </Box>

      <Box
        className={cn(
          "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm",
          "!mt-4",
        )}
      >
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Your referrals</Heading>
        </Box>
        <Box className="!flex-1 !p-[18px] !flex !items-center !gap-1.5">
          <Input
            className=""
            data-field="name"
            placeholder="Pharmacy name"
            value={name}
            onChange={setNameOnChange}
          />
          <Input className="" placeholder="Area" value={area} onChange={setAreaOnChange} />
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            onClick={trimOnClick}
          >
            Add
          </Button>
        </Box>
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!z-[1] [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:text-ink-2 [&_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr:hover]:!bg-wash-2 [&_tbody_tr:last-child_td]:!border-b-0 [&_tfoot_td]:!border-b-0 [&_tfoot_td]:!border-t-2 [&_tfoot_td]:!border-t-line-2 [&_tfoot_td]:!bg-wash-2 [&_tfoot_td]:!font-extrabold [&_tfoot_td]:!text-ink">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Pharmacy</TableHeaderCell>
                <TableHeaderCell>Area</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell className="!text-right !tabular-nums !font-semibold !text-ink">
                  Reward
                </TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="!text-muted">
                    No referrals yet.
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map(renderReferral)
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Box>
  );
  function openOnClick() {
    return open(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
  }
  function openOnClick2() {
    return open(
      `mailto:?subject=${encodeURIComponent("Namma MedMate referral")}&body=${encodeURIComponent(shareText)}`,
    );
  }
  function renderStep(
    s: {
      ic: (p: { size?: number }) => React.JSX.Element;
      t: string;
      s: string;
    },
    i: number,
  ) {
    return (
      <Box
        className="!flex !items-center !gap-3 !border-b !border-line !py-3 last:!border-b-0"
        key={i}
      >
        <Text
          className={cn(
            "grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[10px] bg-wash text-[18px] font-display font-bold leading-none text-mid",
            "!text-[20px]",
          )}
          as="span"
        >
          <s.ic size={18} />
        </Text>
        <Text className="min-w-0 flex-1" as="span">
          <Box className="text-[13.5px] font-bold text-ink">
            {i + 1}. {s.t}
          </Box>
          <Box className="text-xs text-muted">{s.s}</Box>
        </Text>
      </Box>
    );
  }
  function setNameOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setName(e.target.value);
  }
  function setAreaOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setArea(e.target.value);
  }
  function trimOnClick() {
    const n = name.trim();
    if (!n) return;
    void saveReferral({ name: n, area: area.trim() }).then((fault) => {
      if (!fault) {
        setName("");
        setArea("");
      }
    });
  }
  function renderReferral(r: Referral) {
    return (
      <TableRow key={r.id}>
        <TableCell className={cn("!font-semibold")}>{r.name}</TableCell>
        <TableCell>{r.area || "—"}</TableCell>
        <TableCell>
          {r.status === "Paid" ? (
            <Text
              className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid"
              as="span"
            >
              Paid
            </Text>
          ) : (
            <Select
              className=""
              value={r.status}
              onChange={updateReferralOnChange}
              options={[...(["Invited", "Signed up", "Earned"] as ReferralStatus[]).map(render)]}
            />
          )}
        </TableCell>
        <TableCell className="!text-right !tabular-nums !font-semibold !text-ink">
          {r.status === "Paid" ? (
            inr(r.reward)
          ) : (
            <Input
              data-field="amount"
              type="number"
              min={0}
              value={r.reward}
              onChange={updateReferralOnChange2}
              className={cn("", "!w-[90px] !text-right")}
            />
          )}
        </TableCell>
        <TableCell />
      </TableRow>
    );
    function updateReferralOnChange(e: ChangeEvent<HTMLSelectElement>) {
      return changeReferral(r.id, { status: e.target.value as ReferralStatus });
    }
    function render(s: ReferralStatus) {
      return { value: String(s), label: String(s) };
    }
    function updateReferralOnChange2(e: ChangeEvent<HTMLInputElement>) {
      return changeReferral(r.id, {
        reward: Math.max(0, Number(e.target.value) || 0),
      });
    }
  }
}
