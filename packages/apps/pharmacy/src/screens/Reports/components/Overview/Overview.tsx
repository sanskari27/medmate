import type { OverviewProps } from "./Overview.types";
import { Box, Heading, Progress, Text } from "@/components/atoms";
import { SegmentBar } from "@/components/molecules/BarChart";
import { cn } from "@/utils/className";
import { inr, PAY_LABEL, PayMode } from "@/utils";
import { IconRupee, IconReceipt, IconBox, IconTrendUp } from "@/components/atoms";
export function Overview(p: OverviewProps) {
    const { revenue, grossProfit, margin, outputGst, netGst, units, avg, enriched, onlineRev, offlineRev, onlinePct, payMap, online, offline, } = p;
    // top items by GST-exclusive value
    const catRev = new Map<string, number>();
    enriched.forEach((r: any) => r.s.items.forEach((i: any) => {
        const ex = (i.price * i.qty) / (1 + i.gst / 100);
        // category isn't on SaleItem; group by GST slab band as a proxy label
 catRev.set(i.name, (catRev.get(i.name) ?? 0) + ex);}));
 const topItems = [...catRev.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
 const topMax = Math.max(1, ...topItems.map((x) => x[1]));
 return (<>
 <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
 <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
 <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
 <IconRupee size={19}/>
 </Box>
 <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Net revenue</Box>
 <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(revenue)}</Box>
 <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">
 {enriched.length} sales · avg {inr(avg)}
 </Box>
 </Box>
 <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
 <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
 <IconTrendUp size={18}/>
 </Box>
 <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Gross profit</Box>
 <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(grossProfit)}</Box>
 <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">{margin.toFixed(1)}% margin</Box>
 </Box>
 <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
 <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d">
 <IconBox size={18}/>
 </Box>
 <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Units sold</Box>
 <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{units}</Box>
 <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">across {enriched.length} bills</Box>
 </Box>
 <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
 <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-rose-bg !text-rose">
 <IconReceipt size={18}/>
 </Box>
 <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">{netGst >= 0 ?"Net GST payable" :"Net GST credit (c/f)"}</Box>
 <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{inr(Math.abs(netGst))}</Box>
 <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">output {inr(outputGst)}</Box>
 </Box>
 </Box>

 <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
 <Heading level={3}>Top items by value</Heading>
 <Text className="text-[12.5px] text-muted" as="span">GST-exclusive</Text>
 </Box>
 <Box className="!flex-1 !p-[18px]">
 {topItems.length === 0 ? (<Box className={cn("!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink","!p-5")}>
 <Text>No sales in this period.</Text>
 </Box>) : (topItems.map(renderTopItem))}
 </Box>
 </Box>

 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
 <Heading level={3}>Channel & payment mix</Heading>
 </Box>
 <Box className="!flex-1 !p-[18px]">
 <Box className={cn("!text-[12px] !font-bold !text-muted !mb-2")}>
 Online vs Counter
 </Box>
 <SegmentBar className="mb-1.5 h-4 overflow-hidden rounded-sm" segments={channelSegments()} />
 <Box className={cn("!flex !items-center !gap-2.5","!justify-between !text-[12px] !mb-4.5")}>
 <Text as="span">
 <Text as="span" className={cn("font-bold", "!text-mid")}>● Online</Text> {inr(onlineRev)} · {online.length}
 </Text>
 <Text as="span">
 <Text as="span" className={cn("font-bold", "!text-gold-d")}>● Counter</Text> {inr(offlineRev)} ·{""}
 {offline.length}
 </Text>
 </Box>
 <Box className={cn("!text-[12px] !font-bold !text-muted !mb-2.5")}>
 By payment method
 </Box>
 {(["cash","upi","card","cod"] as PayMode[]).map(renderM)}
 </Box>
 </Box>
 </Box>
 </>);
 function renderTopItem([name, val]: [
 string,
 number
 ]) {
 return (<Box key={name} className={cn("!mb-3")}>
 <Box className={cn("!flex !items-center !gap-2.5","!justify-between !text-[13px] !mb-1")}>
 <Text className={cn("!font-bold")} as="span">{name}</Text>
 <Text as="span" className="font-bold">{inr(val)}</Text>
 </Box>
 <Progress className="!h-2 !rounded-[5px]" value={topMax ? (val / topMax) * 100 : 0} label={name}/>
 </Box>);}
 function channelSegments() {
 return [
 { key: "online", value: onlinePct, color: "var(--color-mid)", label: "Online" },
 { key: "counter", value: Math.max(0, 100 - onlinePct), color: "var(--color-gold)", label: "Counter" },
 ];
 }
 function renderM(m: PayMode) {
 const v = payMap.get(m) ?? 0;
 const pct = revenue ? (v / revenue) * 100 : 0;
 return (<Box key={m} className={cn("!mb-[9px]")}>
 <Box className={cn("!flex !items-center !gap-2.5","!justify-between !text-[12.5px] !mb-[3px]")}>
 <Text as="span">{PAY_LABEL[m]}</Text>
 <Text as="span" className="font-bold">{inr(v)}</Text>
 </Box>
 <Progress className="!h-2 !rounded-[5px]" value={pct} label={PAY_LABEL[m]}/>
 </Box>);}}