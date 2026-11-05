import type { Supplier } from "@/utils";
import { Box, Button, Heading, Image, Input, Label, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text, Textarea, Stack } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState, useRef } from "react";
import { usePharma } from "@/hooks";
import { PharmacyProfile, BizDetail, INDIAN_STATES, PHARMACY_BUSINESS_TYPES, REGISTRATION_TYPES, INDUSTRY_TYPES, isValidGstin, } from "@/utils";
import { IconCheck, IconPlus, IconUpload, IconDot, IconSettings } from "@/components/Icon";
import { nextBusinessTypes } from "./Settings.utils";
export default function SettingsScreen() {
    const { profile, updateProfile, invoiceSettings, updateInvoiceSettings, toggleStoreOpen, startSetup, suppliers, go, toast, showFault, } = usePharma();
    const [f, setF] = useState<PharmacyProfile>(profile);
    const [terms, setTerms] = useState(invoiceSettings.terms);
    const [nd, setNd] = useState<BizDetail>({ label: "", value: "" });
    const logoRef = useRef<HTMLInputElement>(null);
    const signRef = useRef<HTMLInputElement>(null);
    const set = (patch: Partial<PharmacyProfile>) => setF((p) => ({ ...p, ...patch }));
    const dirty = JSON.stringify(f) !== JSON.stringify(profile) || terms !== invoiceSettings.terms;
    const save = async () => {
        if (f.gstin.trim() && !isValidGstin(f.gstin)) {
            showFault("Enter a valid GSTIN");
            return;
        }
        const err = await updateProfile({ ...f, gstRegistered: true, phone: profile.phone });
        if (err)
            return;
        updateInvoiceSettings({ terms });
        toast("Business settings saved");
    };
    const discard = () => {
        setF(profile);
        setTerms(invoiceSettings.terms);
    };
    const onFile = (e: React.ChangeEvent<HTMLInputElement>, key: "logo" | "signature") => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const r = new FileReader();
        r.onload = () => set({ [key]: r.result as string } as Partial<PharmacyProfile>);
        r.readAsDataURL(file);
    };
    const toggleType = (t: string) => set({
        businessTypes: nextBusinessTypes(f.businessTypes, t),
    });
    const addDetail = () => {
        if (!nd.label.trim() || !nd.value.trim())
            return;
        set({ extraDetails: [...f.extraDetails, nd] });
        setNd({ label: "", value: "" });
    };
    return (<Box className="!mx-auto !max-w-[1680px]">
      {/* header / save bar */}
      <Box className={cn("!mb-4 !flex !flex-wrap !items-center !gap-2.5 !mb-4 !border-b !border-line !bg-paper/95 !py-2.5 !shadow-[0_4px_16px_rgba(27,61,41,0.06)] !backdrop-blur-sm", "!sticky -!top-5.5 !z-[5]")}>
        <Box>
          <Heading className={cn("!text-[16px]")} level={2}>Business Settings</Heading>
          <Text className={cn("!text-muted", "!text-[12.5px]")} as="span">
            Edit your pharmacy details — shown on invoices & reports
          </Text>
        </Box>
        <Box className="!flex-1"/>
        {dirty && (<Text className={cn("!text-muted", "!text-[12.5px]")} as="span">
            Unsaved changes
          </Text>)}
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" disabled={!dirty} onClick={discard}>
          Discard
        </Button>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!dirty} onClick={save}>
          <IconCheck size={16}/> Save changes
        </Button>
      </Box>

      {/* store-open quick toggle */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-4 !flex !items-center !gap-3.5")}>
        <Text className={cn(profile.storeOpen ? "!text-green" : "!text-rose")} as="span">
          <IconDot size={8}/>
        </Text>
        <Box className={cn("!flex-1")}>
          <Heading className={cn("!text-[15px]")} level={3}>Online store</Heading>
          <Text className={cn("!text-muted", "!text-[12.5px]")}>
            {profile.storeOpen
            ? "Accepting online orders."
            : "Paused — counter billing still works."}
          </Text>
        </Box>
        <Button onClick={toggleStoreOpen} className={cn(`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${profile.storeOpen ? "!bg-mid after:!translate-x-4" : ""}`, "!scale-[1.2]")}/>
      </Box>

      <Box className={cn("!grid !grid-cols-2 !gap-4 max-[767px]:!grid-cols-1", "!items-start")}>
        {/* ───── LEFT column ───── */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          {/* logo + name */}
          <Box className={cn("!flex !items-center !gap-2.5", "!gap-4 !mb-4 !items-start")}>
            <Box>
              <Input ref={logoRef} type="file" accept="image/*" hidden onChange={onFileOnChange}/>
              <Button onClick={clickOnClick} className={cn("!w-[92px] !h-[92px] !rounded-[14px] !border !border-line-2 !border-dashed !grid !place-items-center !overflow-hidden !p-0", f.logo ? "!bg-dark" : "!bg-wash-2")}>
                {f.logo ? (<Image src={f.logo} alt="logo" className={cn("!w-full !h-full !object-contain")}/>) : (<Stack align="center" gap={1} className="text-center text-[11px] text-muted">
                    <IconUpload size={18}/>
                    <Text as="span">Logo</Text>
                  </Stack>)}
              </Button>
              {f.logo && (<Button onClick={setOnClick} className={cn("!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs !border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2", "!mt-1.5 !w-[92px]")}>
                  Remove
                </Button>)}
            </Box>
            <Box className={cn("!flex-1 !min-w-0")}>
              <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
                <Label>Business Name *</Label>
                <Input className="" value={f.name} onChange={setOnChange}/>
              </Box>
              <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mt-2.5")}>
                <Label>Tagline</Label>
                <Input className="" value={f.tagline} onChange={setOnChange2}/>
              </Box>
            </Box>
          </Box>

          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="phone">
              <Label>Company Phone Number</Label>
              <Input value={profile.phone} readOnly aria-readonly="true" className={cn("", "!bg-wash-2")}/>
              <Text className={cn("!text-muted", "!text-[12px]")} as="span">
                Login uses this number, so it cannot be changed.
              </Text>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Company E-Mail</Label>
              <Input className="" value={f.email} onChange={setOnChange3}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Billing Address</Label>
              <Textarea className="!min-h-16 !resize-y" value={f.address} onChange={setOnChange4}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>State</Label>
              <Select className="" value={f.state} onChange={setOnChange5} options={[...(INDIAN_STATES.map(renderINDIANSTATES))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Pincode</Label>
              <Input className="" value={f.pincode} onChange={setOnChange6}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>City</Label>
              <Input className="" value={f.city} onChange={setOnChange7}/>
            </Box>
          </Box>
        </Box>

        {/* ───── Tax & registration ───── */}
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">Tax & registration</Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="gstin">
            <Label>GSTIN *</Label>
            <Input className="!font-mono" value={f.gstin} onChange={setOnChange8}/>
          </Box>

          <ToggleRow label="Enable e-Invoicing" badge="New" on={f.eInvoicing} onClick={setOnClick2}/>

          <Box className={cn("!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1", "!mt-3")}>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>PAN Number</Label>
              <Input className="!font-mono" value={f.pan} onChange={setOnChange9}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Drug Licence No. (D.L.)</Label>
              <Input className="!font-mono" value={f.dlNo} onChange={setOnChange10}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>FSSAI Licence No.</Label>
              <Input className="!font-mono" value={f.fssai} onChange={setOnChange11}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Trade Licence No.</Label>
              <Input className="!font-mono" value={f.tradeNo || ""} onChange={setOnChange12}/>
            </Box>
          </Box>

          <ToggleRow label="Enable TDS" on={f.enableTDS} onClick={setOnClick3}/>
          <ToggleRow label="Enable TCS" on={f.enableTCS} onClick={setOnClick4}/>

          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mt-3")}>
            <Label>Registered pharmacist (on invoice)</Label>
            <Input className="" value={f.pharmacist} onChange={setOnChange13}/>
          </Box>
        </Box>
      </Box>

      {/* ───── store categories + invoice terms ───── */}
      <Box className={cn("!grid !grid-cols-2 !gap-4 max-[767px]:!grid-cols-1", "!items-stretch !mt-4")}>
        <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Store categories (select multiple, if applicable)</Label>
            <Box className={cn("!flex !items-center !gap-1.5", "!mt-1.5 !flex-wrap")}>
              {PHARMACY_BUSINESS_TYPES.map(renderPHARMACYBUSINESSTYPES)}
            </Box>
          </Box>
          <Box className={cn("!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1", "!mt-3.5")}>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Industry Type</Label>
              <Select className="" value={f.industryType} onChange={setOnChange14} options={[...(INDUSTRY_TYPES.map(renderINDUSTRYTYPES))]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Business Registration Type</Label>
              <Select className="" value={f.registrationType} onChange={setOnChange15} options={[...(REGISTRATION_TYPES.map(renderREGISTRATIONTYPES))]} />
            </Box>
          </Box>
        </Box>

        {/* T&C + signature */}
        <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-4")}>
          <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!bg-wash-2 !py-2.5 !px-3 !mb-3.5 !border !border-line")}>
            <Text className={cn("!text-[12.5px]")} as="span">
              <Text as="span" className="font-bold">Note:</Text> Terms &amp; Conditions and Signature below are shown on your invoices.
            </Text>
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label>Terms &amp; Conditions</Label>
            <Textarea className="!min-h-16 !resize-y" value={terms} onChange={setTermsOnChange}/>
          </Box>

          <Box className={cn("!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2", "!mt-3.5")}>
            <Label>Signature</Label>
            <Input ref={signRef} type="file" accept="image/*" hidden onChange={onFileOnChange2}/>
            {f.signature ? (<Box className={cn("!border !border-line-2 !border-dashed !rounded-md !p-3 !inline-block !mt-1")}>
                <Image src={f.signature} alt="signature" className={cn("!max-h-[90px] !max-w-[220px] !object-contain !block")}/>
                <Button onClick={setOnClick5} className={cn("!h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs", "!text-rose !bg-transparent !py-1 !px-0")}>
                  Remove
                </Button>
              </Box>) : (<Button onClick={clickOnClick2} className={cn("!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2", "!mt-1")}>
                <IconUpload size={15}/> Upload signature / stamp
              </Button>)}
          </Box>
        </Box>
      </Box>

      {/* additional business details */}
      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
        <Heading className={cn("!text-[14px]")} level={3}>Add Business Details</Heading>
        <Text className={cn("!text-muted", "!text-[12.5px] !mb-3")}>
          Additional info such as MSME number, Website, etc.
        </Text>
        <Box className={cn("!flex !items-center !gap-1.5", "!items-stretch")}>
          <Input className="" placeholder="Label (e.g. MSME)" value={nd.label} onChange={setNdOnChange}/>
          <Text className={cn("!flex !items-center !gap-2.5", "!text-muted")} as="span">
            =
          </Text>
          <Input className="" placeholder="Value" value={nd.value} onChange={setNdOnChange2}/>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={addDetail}>
            <IconPlus size={15}/> Add
          </Button>
        </Box>
        {f.extraDetails.length > 0 && (<Box className={cn("!mt-3.5")}>
            {f.extraDetails.map(renderExtraDetail)}
          </Box>)}
      </Box>

      {/* suppliers */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", "!mt-4")}>
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Distributors</Heading>
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={goOnClick}>
            Manage distributors →
          </Button>
        </Box>
        <Box className="!overflow-x-auto">
          <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Distributor</TableHeaderCell>
                <TableHeaderCell>GSTIN</TableHeaderCell>
                <TableHeaderCell>Phone</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map(renderSupplier)}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {/* re-run setup */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mt-4 !flex !items-center !gap-3.5")}>
        <Text className={cn("!text-[24px]")} as="span">
          <IconSettings size={24}/>
        </Text>
        <Box className={cn("!flex-1")}>
          <Heading className={cn("!text-[14px]")} level={3}>Store setup wizard</Heading>
          <Text className={cn("!text-muted", "!text-[12.5px]")}>
            Re-run the guided setup to reconfigure your pharmacy, features and catalogue.
          </Text>
        </Box>
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={startSetup}>
          Run setup
        </Button>
      </Box>
    </Box>);
    function onFileOnChange(e: ChangeEvent<HTMLInputElement>) {
        return onFile(e, "logo");
    }
    function clickOnClick() {
        return logoRef.current?.click();
    }
    function setOnClick() {
        return set({ logo: undefined });
    }
    function setOnChange(e: ChangeEvent<HTMLInputElement>) {
        return set({ name: e.target.value });
    }
    function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return set({ tagline: e.target.value });
    }
    function setOnChange3(e: ChangeEvent<HTMLInputElement>) {
        return set({ email: e.target.value });
    }
    function setOnChange4(e: ChangeEvent<HTMLTextAreaElement>) {
        return set({ address: e.target.value });
    }
    function setOnChange5(e: ChangeEvent<HTMLSelectElement>) {
        return set({ state: e.target.value });
    }
    function renderINDIANSTATES(s: string) {
        return { value: String(s), label: String(s) };
    }
    function setOnChange6(e: ChangeEvent<HTMLInputElement>) {
        return set({ pincode: e.target.value });
    }
    function setOnChange7(e: ChangeEvent<HTMLInputElement>) {
        return set({ city: e.target.value });
    }
    function setOnChange8(e: ChangeEvent<HTMLInputElement>) {
        return set({ gstin: e.target.value.toUpperCase(), gstRegistered: true });
    }
    function setOnClick2() {
        return set({ eInvoicing: !f.eInvoicing });
    }
    function setOnChange9(e: ChangeEvent<HTMLInputElement>) {
        return set({ pan: e.target.value });
    }
    function setOnChange10(e: ChangeEvent<HTMLInputElement>) {
        return set({ dlNo: e.target.value });
    }
    function setOnChange11(e: ChangeEvent<HTMLInputElement>) {
        return set({ fssai: e.target.value });
    }
    function setOnChange12(e: ChangeEvent<HTMLInputElement>) {
        return set({ tradeNo: e.target.value.toUpperCase() });
    }
    function setOnClick3() {
        return set({ enableTDS: !f.enableTDS });
    }
    function setOnClick4() {
        return set({ enableTCS: !f.enableTCS });
    }
    function setOnChange13(e: ChangeEvent<HTMLInputElement>) {
        return set({ pharmacist: e.target.value });
    }
    function renderPHARMACYBUSINESSTYPES(t: string) {
        return (<Button key={t} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${f.businessTypes.includes(t) ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={toggleTypeOnClick}>
                  {t}
                </Button>);
        function toggleTypeOnClick() {
            return toggleType(t);
        }
    }
    function setOnChange14(e: ChangeEvent<HTMLSelectElement>) {
        return set({ industryType: e.target.value });
    }
    function renderINDUSTRYTYPES(i: string) {
        return { value: String(i), label: String(i) };
    }
    function setOnChange15(e: ChangeEvent<HTMLSelectElement>) {
        return set({ registrationType: e.target.value });
    }
    function renderREGISTRATIONTYPES(r: string) {
        return { value: String(r), label: String(r) };
    }
    function setTermsOnChange(e: ChangeEvent<HTMLTextAreaElement>) {
        return setTerms(e.target.value);
    }
    function onFileOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return onFile(e, "signature");
    }
    function setOnClick5() {
        return set({ signature: undefined });
    }
    function clickOnClick2() {
        return signRef.current?.click();
    }
    function setNdOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setNd({ ...nd, label: e.target.value });
    }
    function setNdOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return setNd({ ...nd, value: e.target.value });
    }
    function renderExtraDetail(d: BizDetail, i: number) {
        return (<Box key={i} className={cn("!flex !items-center !gap-2.5", "!justify-between !py-[9px] !px-0 !border-t !border-line")}>
                <Box>
                  <Box className={cn("!font-bold !text-[13px]")}>{d.label}</Box>
                  <Box className={cn("!text-muted", "!text-[12.5px]")}>
                    {d.value}
                  </Box>
                </Box>
              </Box>);
    }
    function goOnClick() {
        return go("distributors");
    }
    function renderSupplier(s: Supplier) {
        return (<TableRow key={s.id}>
                  <TableCell className={cn("!font-bold")}>{s.name}</TableCell>
                  <TableCell className="!font-mono">{s.gstin}</TableCell>
                  <TableCell>{s.phone}</TableCell>
                </TableRow>);
    }
}
function ToggleRow({ label, on, onClick, badge, }: {
    label: string;
    on: boolean;
    onClick: () => void;
    badge?: string;
}) {
    return (<Box className={cn("!flex !items-center !gap-2.5", "!justify-between !py-[11px] !px-0 !border-b !border-line")}>
      <Text className={cn("!flex !items-center !gap-1.5", "!text-[13.5px] !font-semibold")} as="span">
        {label}
        {badge && (<Text className={cn("!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-blue-bg !text-blue", "!text-[9px]")} as="span">
            {badge}
          </Text>)}
      </Text>
      <Button className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${on ? "!bg-mid after:!translate-x-4" : ""}`} onClick={onClick}/>
    </Box>);
}
