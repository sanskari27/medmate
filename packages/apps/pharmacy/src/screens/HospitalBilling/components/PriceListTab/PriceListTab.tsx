import type { InvProduct } from "@/utils";
import { Box, Button, Input, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { inr, mrpOf } from "@/utils";
import { PriceMode } from "@/utils/calculations/hospitalAccount";
import { IconSearch, IconX, IconLock, IconUnlock, IconKey } from "@/components/atoms";
import { monogramOf } from "@/components/molecules";
import { useCreditPrice } from "@/screens/HospitalBilling/hooks/useCreditPrice";
import { AdminOtpModal } from "@/screens/HospitalBilling/components/AdminOtpModal";
export function PriceListTab() {
    const { inventory, hospitalPriceRules, hospitalAccount, setUniformDiscount, setHospitalPriceRule, pricingUnlocked, lockPricing, } = usePharma();
    const cp = useCreditPrice();
    const [q, setQ] = useState("");
    const [otp, setOtp] = useState(false);
    const locked = !pricingUnlocked;
    const list = inventory.filter((p) => !q.trim() ||
        `${p.name} ${p.composition} ${p.manufacturer}`.toLowerCase().includes(q.toLowerCase()));
    const custom = Object.keys(hospitalPriceRules).length;
    return (<>
      {/* lock banner */}
      <Box className={`!flex !items-center !gap-[13px] !rounded-lg !border !border-line-2 !bg-wash-2 !px-4 !py-[13px] ${locked ? "!border-[#f0d9a8] !bg-amber-bg" : ""}`}>
        <Text className="!shrink-0 !text-[22px]" as="span">{locked ? <IconLock size={16}/> : <IconUnlock size={16}/>}</Text>
        <Box className="min-w-0 flex-1">
          <Text as="span" className="font-bold">{locked ? "Pricing is locked" : "Pricing unlocked by admin"}</Text>
          <Text as="span" className="text-[11px] font-semibold">
            {locked
            ? "Changing the institutional discount or any product price needs admin OTP approval."
            : "You can change the uniform discount and per-product prices. Lock when done."}
          </Text>
        </Box>
        {locked ? (<Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={setOtpOnClick}>
            <IconKey size={13}/> Unlock with admin OTP
          </Button>) : (<Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={lockPricing}>
            Lock pricing
          </Button>)}
      </Box>

      {/* uniform discount */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mt-3.5")}>
        <Box className={cn("!flex !items-center !gap-2.5", "!gap-3.5 !flex-wrap")}>
          <Box>
            <Box className={cn("!font-display !font-extrabold !text-[14px]")}>
              Uniform institutional discount
            </Box>
            <Box className={cn("!text-muted", "!text-[12.5px]")}>
              Applies to every product without its own rule · {custom} product
              {custom !== 1 ? "s" : ""} customised
            </Box>
          </Box>
          <Box className="!flex-1"/>
          <Box className="!flex !items-center !gap-1.5">
            <Input type="number" min={0} max={95} disabled={locked} value={hospitalAccount.discountPct} onChange={setUniformDiscountOnChange} className={cn("", "!w-[90px] !text-right", locked ? "!opacity-[0.55]" : "!opacity-[1]")}/>
            <Text className={cn("!font-extrabold !self-center")} as="span">% off MRP</Text>
          </Box>
        </Box>
      </Box>

      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5", "!my-3.5 !mx-0")}>
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17}/>
          </Text>
          <Input placeholder="Search medicine…" value={q} onChange={setQOnChange}/>
        </Box>
        <Box className="!flex-1"/>
        <Text className={cn("!text-muted", "!text-[13px]")} as="span">
          Per-product: set a % or flat ₹ discount off MRP. Credit price = what the hospital is
          billed.
        </Text>
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Medicine</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">MRP</TableHeaderCell>
                <TableHeaderCell>Discount type</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Value</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Credit price</TableHeaderCell>
                <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Eff. disc</TableHeaderCell>
                <TableHeaderCell>Pricing</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {list.map(renderList)}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {otp && <AdminOtpModal onClose={setOtpOnClose}/>}
    </>);
    function setOtpOnClick() {
        return setOtp(true);
    }
    function setUniformDiscountOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setUniformDiscount(Number(e.target.value) || 0);
    }
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
    }
    function renderList(p: InvProduct) {
        const mrp = mrpOf(p);
        const price = cp(p.id);
        const rule = hospitalPriceRules[p.id];
        const mode: PriceMode = rule?.mode ?? "percent";
        const off = mrp > 0 ? Math.round((1 - price / mrp) * 100) : 0;
        const setMode = (m: PriceMode) => setHospitalPriceRule(p.id, {
            mode: m,
            value: rule?.value ?? (m === "percent" ? hospitalAccount.discountPct : 0),
        });
        return (<TableRow key={p.id}>
                    <TableCell>
                      <Box className="flex items-center gap-2.5">
                        <Text className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid" as="span">{monogramOf(p.name)}</Text>
                        <Text className="!font-bold !text-ink" as="span">{p.name}</Text>
                      </Box>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(mrp)}</TableCell>
                    <TableCell>
                      <Box className={cn("!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5", "!inline-flex", locked ? "!opacity-[0.55]" : "!opacity-[1]")}>
                        <Button disabled={locked} onClick={setModeOnClick} className={cn(mode === "percent" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold", "!py-1 !px-2.5")}>
                          %
                        </Button>
                        <Button disabled={locked} onClick={setModeOnClick2} className={cn(mode === "flat" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold", "!py-1 !px-2.5")}>
                          ₹
                        </Button>
                      </Box>
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">
                      <Input disabled={locked} type="number" min={0} value={rule ? rule.value : ""} placeholder={mode === "percent" ? String(hospitalAccount.discountPct) : "—"} onChange={setHospitalPriceRuleOnChange} className={cn("!font-mono", "!w-[74px] !text-right !py-[5px] !px-2", locked ? "!opacity-[0.55]" : "!opacity-[1]")}/>
                    </TableCell>
                    <TableCell className={cn("text-right tabular-nums font-semibold text-ink", "!font-extrabold")}>
                      {inr(price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-ink">{off}%</TableCell>
                    <TableCell>
                      {rule ? (<Text className="!flex !items-center !gap-1.5" as="span">
                          <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-amber-bg !text-gold-d" as="span">
                            Custom {rule.mode === "percent" ? rule.value + "%" : "₹" + rule.value}
                          </Text>
                          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid" disabled={locked} title="Reset to uniform" onClick={setHospitalPriceRuleOnClick}>
                            <IconX size={13}/>
                          </Button>
                        </Text>) : (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted" as="span">
                          Uniform −{hospitalAccount.discountPct}%
                        </Text>)}
                    </TableCell>
                  </TableRow>);
        function setModeOnClick() {
            return setMode("percent");
        }
        function setModeOnClick2() {
            return setMode("flat");
        }
        function setHospitalPriceRuleOnChange(e: ChangeEvent<HTMLInputElement>) {
            return setHospitalPriceRule(p.id, e.target.value === "" ? null : { mode, value: Number(e.target.value) });
        }
        function setHospitalPriceRuleOnClick() {
            return setHospitalPriceRule(p.id, null);
        }
    }
    function setOtpOnClose() {
        return setOtp(false);
    }
}
