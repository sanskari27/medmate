import { Box, Button, DataList, Heading, Image, Input, Label, Text, Textarea } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useMemo, useRef } from "react";
import { usePharma } from "@/hooks";
import { Sale, mrpOf, sellPrice, INVOICE_TEMPLATES, INVOICE_ACCENTS, INVOICE_TITLES, InvoiceTemplate, } from "@/utils";
import { IconImage, IconPrint, IconCheck, IconStore } from "@/components/atoms";
import { Invoice } from "@/components/organisms";
import { ColorFill } from "@/components/molecules/BarChart";
import { thermalPreviewClass } from "./InvoiceSettings.utils";
export default function InvoiceSettingsScreen() {
    const { invoiceSettings: cfg, updateInvoiceSettings, updateProfile, inventory, profile, } = usePharma();
    const logoRef = useRef<HTMLInputElement>(null);
    const stampRef = useRef<HTMLInputElement>(null);
    const readFile = (file: File | undefined, cb: (dataUrl: string) => void) => {
        if (!file)
            return;
        const r = new FileReader();
        r.onload = () => cb(r.result as string);
        r.readAsDataURL(file);
    };
    // a sample sale to preview the invoice live
    const sample = useMemo<Sale>(() => {
        const line = (p: (typeof inventory)[number] | undefined, qty: number) => {
            const b = p?.batches[0];
            return {
                productId: p?.id ?? "preview",
                name: p?.name ?? "Preview item",
                batchNo: b?.batchNo ?? "—",
                expiry: b?.expiry ?? "—",
                hsn: p?.hsn ?? "—",
                qty,
                mrp: p ? mrpOf(p) : 0,
                price: p ? sellPrice(p) : 0,
                gst: p?.gst ?? 0,
            };
        };
        const second = inventory[1];
        return {
            id: cfg.prefix + "PREVIEW",
            channel: "offline",
            status: "completed",
            customer: { name: "Preview" },
            items: second ? [line(inventory[0], 1), line(second, 1)] : [line(inventory[0], 1)],
            discount: 0,
            payMode: "upi",
            rx: false,
            createdAt: Date.now(),
        };
    }, [inventory, cfg.prefix]);
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className="!grid !items-start !gap-4 lg:!grid-cols-[minmax(0,1fr)_420px] max-[767px]:!grid-cols-1">
        {/* ── settings ── */}
        <Box className="!min-w-0">
          {/* template */}
          <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
            <Box className={cn("!mb-4", "!mt-0")}>
              <IconImage size={15}/> Invoice template
            </Box>
            <Box className="!grid !grid-cols-2 !gap-2 max-[767px]:!grid-cols-1">
              {INVOICE_TEMPLATES.map(renderINVOICETEMPLATES)}
            </Box>

            <Box className="!mb-4">Accent colour</Box>
            <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap")}>
              {INVOICE_ACCENTS.map(renderINVOICEACCENTS)}
              <Label className="!relative !h-8 !w-8 !overflow-hidden !rounded-full !border-2 !border-transparent !h-8 !w-8 !overflow-hidden !rounded-full" title="Custom colour">
                <Input type="color" value={cfg.accent} onChange={updateInvoiceSettingsOnChange}/>
              </Label>
            </Box>
          </Box>

          {/* branding: logo + stamp */}
          <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
            <Box className={cn("!mb-4", "!mt-0")}>
              <IconStore size={15}/> Branding
            </Box>
            <Box className="!grid !grid-cols-3 !gap-2 max-[767px]:!grid-cols-1">
              <Box className="!grid !h-14 !w-14 !place-items-center !rounded-md !border !border-dashed !border-line-2">
                <Label>Brand logo</Label>
                <Box className="!h-14 !w-14 !rounded-md !border !border-line !object-contain">
                  {profile.logo ? (<Image src={profile.logo} alt="logo"/>) : (<Text className="text-muted" as="span">
                      <IconImage size={22}/>
                    </Text>)}
                </Box>
                <Input ref={logoRef} type="file" accept="image/*" hidden onChange={readFileOnChange}/>
                <Box className="!flex !items-center !gap-1.5">
                  <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={clickOnClick}>
                    {profile.logo ? "Change" : "Upload"}
                  </Button>
                </Box>
                <Row label="Show logo on invoice" on={cfg.showLogo} onClick={updateInvoiceSettingsOnClick3}/>
              </Box>

              <Box className="!grid !h-14 !w-14 !place-items-center !rounded-md !border !border-dashed !border-line-2">
                <Label>Signature / seal stamp</Label>
                <Box className="!h-14 !w-14 !rounded-md !border !border-line !object-contain bg-[#fbfbfb]">
                  {cfg.stamp ? (<Image src={cfg.stamp} alt="stamp"/>) : (<Text className="text-muted" as="span">
                      <IconImage size={22}/>
                    </Text>)}
                </Box>
                <Input ref={stampRef} type="file" accept="image/*" hidden onChange={readFileOnChange2}/>
                <Box className="!flex !items-center !gap-1.5">
                  <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={clickOnClick2}>
                    {cfg.stamp ? "Change" : "Upload"}
                  </Button>
                </Box>
                <Row label="Show stamp on invoice" on={cfg.showStamp} onClick={updateInvoiceSettingsOnClick4}/>
              </Box>
            </Box>
            <Text className={cn("!text-muted", "!text-[11.5px] !mt-2.5")}>
              The pharmacist's signature is uploaded in <Text as="span" className="font-bold">Settings → business profile</Text> and
 prints beside the stamp.
 </Text>
 </Box>

 {/* content */}
 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
 <Box className={cn("!mb-4","!mt-0")}>
 Content
 </Box>
 <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
 <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
 <Label>Document title</Label>
 <Input className="" list="inv-titles" value={cfg.title} onChange={updateInvoiceSettingsOnChange2}/>
 <DataList id="inv-titles" options={INVOICE_TITLES.map(renderINVOICETITLES)} />
 </Box>
 <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
 <Label>Invoice number prefix</Label>
 <Input className="!font-mono" value={cfg.prefix} onChange={updateInvoiceSettingsOnChange3}/>
 </Box>
 <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
 <Label>Signatory label</Label>
 <Input className="" value={cfg.signatory} onChange={updateInvoiceSettingsOnChange4}/>
 </Box>
 <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
 <Label>Bank details line</Label>
 <Input className="" value={cfg.bankLine} onChange={updateInvoiceSettingsOnChange5}/>
 </Box>
 <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
 <Label>Terms &amp; conditions</Label>
 <Textarea className="!min-h-16 !resize-y" value={cfg.terms} onChange={updateInvoiceSettingsOnChange6}/>
 </Box>
 <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
 <Label>Footer note</Label>
 <Input className="" value={cfg.footerNote} onChange={updateInvoiceSettingsOnChange7}/>
 </Box>
 </Box>

 <Box className="!mb-4">Display options</Box>
 <Row label="Show “you saved …” on MRP" on={cfg.showSavings} onClick={updateInvoiceSettingsOnClick5}/>
 <Row label="Include prescribing doctor" on={cfg.includeDoctor} onClick={updateInvoiceSettingsOnClick6}/>
 <Row label="Show HSN column" on={cfg.showHsn} onClick={updateInvoiceSettingsOnClick7}/>
 <Row label="Print bank details" on={cfg.showBank} onClick={updateInvoiceSettingsOnClick8}/>
 </Box>
 </Box>

 {/* ── live preview ── */}
 <Box className="!min-w-0">
 <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
 <Box className="!flex !flex-wrap !items-center !justify-between !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
 <Heading level={3}>Live preview</Heading>
 <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={printOnClick}>
 <IconPrint size={14}/> Print sample
 </Button>
 </Box>
 <Box className={cn("!flex-1 !p-[18px]","!bg-wash-2")}>
 <Box className={`!rounded-md !border !border-line !bg-paper !p-4 !shadow-sm${thermalPreviewClass(cfg.template)}`}>
 <Invoice sale={sample} profile={profile}/>
 </Box>
 </Box>
 </Box>
 </Box>
 </Box>
 </Box>);
 function renderINVOICETEMPLATES(tp: {
 key: InvoiceTemplate;
 name: string;
 desc: string;}) {
 return (<Button key={tp.key} className={`!rounded-md !border !border-line !bg-paper !p-2 !text-left ${cfg.template === tp.key ?" !border-mid !ring-2 !ring-mid" :""}`} onClick={updateInvoiceSettingsOnClick}>
 <TemplateThumb kind={tp.key} accent={cfg.accent}/>
 <Text className="!flex !w-full !items-center !justify-between !gap-[5px] !text-[13px] !font-extrabold !text-ink" as="span">
 {tp.name}
 {cfg.template === tp.key && <IconCheck size={13}/>}
 </Text>
 <Text className="text-[11px] text-muted" as="span">{tp.desc}</Text>
 </Button>);
 function updateInvoiceSettingsOnClick() {
 return updateInvoiceSettings({ template: tp.key});}}
 function renderINVOICEACCENTS(c: string) {
 return (<Button key={c} className={`!relative !h-8 !w-8 !overflow-hidden !rounded-full !border-2 !border-transparent ${cfg.accent === c ?" !ring-2 !ring-mid" :""} !relative !overflow-hidden`} onClick={updateInvoiceSettingsOnClick2} aria-label={c}>
 <ColorFill color={c} className="pointer-events-none absolute inset-0 h-full w-full" />
 {cfg.accent === c && <IconCheck size={13}/>}
 </Button>);
 function updateInvoiceSettingsOnClick2() {
 return updateInvoiceSettings({ accent: c});}}
 function updateInvoiceSettingsOnChange(e: ChangeEvent<HTMLInputElement>) {
 return updateInvoiceSettings({ accent: e.target.value});}
 function readFileOnChange(e: ChangeEvent<HTMLInputElement>) {
 return readFile(e.target.files?.[0], (d) => updateProfile({ logo: d}));}
 function clickOnClick() {
 return logoRef.current?.click();}
 function updateInvoiceSettingsOnClick3() {
 return updateInvoiceSettings({ showLogo: !cfg.showLogo});}
 function readFileOnChange2(e: ChangeEvent<HTMLInputElement>) {
 return readFile(e.target.files?.[0], (d) => updateInvoiceSettings({ stamp: d, showStamp: true}));}
 function clickOnClick2() {
 return stampRef.current?.click();}
 function updateInvoiceSettingsOnClick4() {
 return updateInvoiceSettings({ showStamp: !cfg.showStamp});}
 function updateInvoiceSettingsOnChange2(e: ChangeEvent<HTMLInputElement>) {
 return updateInvoiceSettings({ title: e.target.value});}
 function renderINVOICETITLES(t: string) {
 return { value: String(t), label: String(t) };}
 function updateInvoiceSettingsOnChange3(e: ChangeEvent<HTMLInputElement>) {
 return updateInvoiceSettings({ prefix: e.target.value});}
 function updateInvoiceSettingsOnChange4(e: ChangeEvent<HTMLInputElement>) {
 return updateInvoiceSettings({ signatory: e.target.value});}
 function updateInvoiceSettingsOnChange5(e: ChangeEvent<HTMLInputElement>) {
 return updateInvoiceSettings({ bankLine: e.target.value});}
 function updateInvoiceSettingsOnChange6(e: ChangeEvent<HTMLTextAreaElement>) {
 return updateInvoiceSettings({ terms: e.target.value});}
 function updateInvoiceSettingsOnChange7(e: ChangeEvent<HTMLInputElement>) {
 return updateInvoiceSettings({ footerNote: e.target.value});}
 function updateInvoiceSettingsOnClick5() {
 return updateInvoiceSettings({ showSavings: !cfg.showSavings});}
 function updateInvoiceSettingsOnClick6() {
 return updateInvoiceSettings({ includeDoctor: !cfg.includeDoctor});}
 function updateInvoiceSettingsOnClick7() {
 return updateInvoiceSettings({ showHsn: !cfg.showHsn});}
 function updateInvoiceSettingsOnClick8() {
 return updateInvoiceSettings({ showBank: !cfg.showBank});}
 function printOnClick() {
 return window.print();}}
// tiny visual thumbnail of each template
function TemplateThumb({ kind, accent}: {
 kind: InvoiceTemplate;
 accent: string;}) {
 if (kind ==="thermal")
 return (<Text className="!h-24 !w-full !rounded-sm !border !border-line !bg-paper" as="span">
 <Text className="mx-auto flex w-[54px] flex-col gap-[3px]" as="span">
 <Box className={cn("h-1 w-full rounded-sm bg-[#e4e4e4]","!w-3/5 !mx-auto !my-0")} />
 <Box className={cn("h-1 w-full rounded-sm bg-[#e4e4e4]","!w-2/5 !mx-auto !my-0.5")} />
 <Box className="h-1 w-full rounded-sm bg-[#e4e4e4]" />
 <Box className="h-1 w-full rounded-sm bg-[#e4e4e4]" />
 <ColorFill color={accent} className="h-1 w-full rounded-sm bg-[#e4e4e4]" width="100%" height={4} />
 </Text>
 </Text>);
 const band = kind ==="modern";
 return (<Text className="!h-24 !w-full !rounded-sm !border !border-line !bg-paper" as="span">
 <Text className={cn("flex items-center gap-[5px] pb-1","!relative", !band &&"!border-b-2", !band && kind ==="minimal" &&"!border-[#ddd]")} as="span">
 {band ? (<ColorFill color={accent} className="pointer-events-none absolute inset-0 h-full w-full" />) : kind !=="minimal" ? (<ColorFill color={accent} className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 w-full" height={2} />) : null}
 <ColorFill className="inline-block h-3 w-3 rounded-[3px]" width={12} height={12} radius={3} color={band ? "rgba(255,255,255,.7)" : accent} />
 <Box className={cn("ml-auto inline-block h-1.5 w-9 rounded-sm", band ?"!bg-paper/60" :"!bg-[#bbb]")} />
 </Text>
 <Text className="mt-[5px] flex flex-col gap-[3px]" as="span">
 <Box className="block h-1 rounded-sm bg-[#ececec]" />
 <Box className="block h-1 rounded-sm bg-[#ececec]" />
 <Box className="block h-1 rounded-sm bg-[#ececec]" />
 </Text>
 <ColorFill className="ml-auto mt-1.5 h-1.5 w-2/5 rounded-sm" width="40%" height={6} radius={2} color={accent} />
 </Text>);}
function Row({ label, on, onClick}: {
 label: string;
 on: boolean;
 onClick: () => void;}) {
 return (<Box className={cn("!flex !items-center","!justify-between !py-[9px] !px-0 !border-b !border-line")}>
 <Text className={cn("!text-[13px] !font-semibold")} as="span">{label}</Text>
 <Button className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${on ? "!bg-mid after:!translate-x-4" : ""}`} onClick={onClick}/>
    </Box>);
}
