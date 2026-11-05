import type { CategoryKey, InvProduct } from "@/utils";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { CATEGORIES, catLabel, Offer, OfferType, OfferScope, inr } from "@/utils";
import { IconPlus, IconX, IconOffer, IconTag, IconGlobe } from "@/components/atoms";
import { productsInOffer } from "./Offers.utils";
export default function OffersScreen() {
    const { offers, inventory, addOffer, toggleOffer } = usePharma();
    const [open, setOpen] = useState(false);
    const productsIn = (o: Offer) => productsInOffer(inventory, o);
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Heading className={cn("!text-[16px]")} level={2}>Active & scheduled offers</Heading>
        <Box className="!flex-1"/>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setOpenOnClick}>
          <IconPlus size={16}/> Create offer
        </Button>
      </Box>

      {offers.length === 0 ? (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
            <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
              <IconTag size={30}/>
            </Box>
            <Heading level={3}>No offers yet</Heading>
            <Text>Create a discount to attract online customers.</Text>
          </Box>
        </Box>) : (<Box className="!grid !grid-cols-[repeat(auto-fill,minmax(280px,1fr))] !gap-3.5">
          {offers.map(renderOffer)}
        </Box>)}

      {open && (<OfferModal onClose={setOpenOnClose} onSave={addOfferOnSave}/>)}
    </Box>);
    function setOpenOnClick() {
        return setOpen(true);
    }
    function renderOffer(o: Offer) {
        return (<Box key={o.id} className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm", o.active ? "!opacity-[1]" : "!opacity-[0.62]")}>
              <Box className="!flex-1 !p-[18px]">
                <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-2.5")}>
                  <Box className={cn("!w-[42px] !h-[42px] !rounded-[11px] !bg-gradient-to-br from-gold to-gold-d !text-paper !grid !place-items-center")}>
                    <IconOffer size={22}/>
                  </Box>
                  <Button className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${o.active ? "!bg-mid after:!translate-x-4" : ""}`} onClick={toggleOfferOnClick} aria-label="Toggle offer"/>
                </Box>
                <Heading className={cn("!text-[15px]")} level={3}>{o.title}</Heading>
                <Box className={cn("!flex !items-center !gap-1.5", "!mt-2 !flex-wrap")}>
                  <Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-wash !text-mid" as="span">
                    {o.type === "pct" ? `${o.value}% OFF` : `${inr(o.value)} OFF`}
                  </Text>
                  <Text className="!font-mono !inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2" as="span">{o.code}</Text>
                  {o.online ? (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-blue-bg !text-blue" as="span">
                      <IconGlobe size={12}/> Online
                    </Text>) : (<Text className="!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-gray-pill !text-muted" as="span">Counter</Text>)}
                </Box>
                <Text className={cn("!text-muted", "!text-[12.5px] !mt-2.5")}>
                  Applies to{" "}
                  <Text as="span" className="font-bold">
                    {o.scope === "all"
                ? "all products"
                : o.scope === "category"
                    ? catLabel(o.target ?? "")
                    : "1 product"}
                  </Text>{" "}
                  · {productsIn(o)} items
                </Text>
              </Box>
              <Box className={cn("!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5", "!border-t !border-line !justify-between")}>
                <Text className={cn("!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold", o.active ? "!bg-wash" : "!bg-gray-pill", o.active ? "!text-mid" : "!text-muted")} as="span">
                  <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
                  {o.active ? "Running" : "Paused"}
                </Text>
              </Box>
            </Box>);
        function toggleOfferOnClick() {
            return toggleOffer(o.id);
        }
    }
    function setOpenOnClose() {
        return setOpen(false);
    }
    async function addOfferOnSave(o: Offer) {
        const err = await addOffer(o);
        if (!err)
            setOpen(false);
    }
}
function OfferModal({ onClose, onSave }: {
    onClose: () => void;
    onSave: (o: Offer) => void;
}) {
    const { inventory } = usePharma();
    const [f, setF] = useState<Offer>({
        id: "of" + Math.floor(Date.now() % 100000),
        title: "",
        code: "",
        type: "pct",
        value: 10,
        scope: "all",
        target: undefined,
        online: true,
        active: true,
    });
    const set = (patch: Partial<Offer>) => setF((p) => ({ ...p, ...patch }));
    const valid = f.title.trim() && f.code.trim() && f.value > 0;
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box className="!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop" onClick={stopPropagationOnClick}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Create offer</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1" data-field="name">
              <Label>Offer title</Label>
              <Input className="" value={f.title} onChange={setOnChange} placeholder="Monsoon Health Sale"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Coupon code</Label>
              <Input className="!font-mono" value={f.code} onChange={setOnChange2} placeholder="NAMMA25"/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Discount type</Label>
              <Select className="" value={f.type} onChange={setOnChange3} options={[{ value: "pct", label: "Percentage %" }, { value: "flat", label: "Flat \u20b9" }]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>{f.type === "pct" ? "Percent off" : "Amount off (₹)"}</Label>
              <Input className="" type="number" value={f.value} onChange={setOnChange4}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Applies to</Label>
              <Select className="" value={f.scope} onChange={setOnChange5} options={[{ value: "all", label: "All products" }, { value: "category", label: "A category" }, { value: "product", label: "One product" }]} />
            </Box>
            {f.scope === "category" && (<Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
                <Label>Category</Label>
                <Select className="" value={f.target ?? ""} onChange={setOnChange6} options={[{ value: "", label: "Select\u2026" }, ...CATEGORIES.map(renderCATEGORIES)]} />
              </Box>)}
            {f.scope === "product" && (<Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
                <Label>Product</Label>
                <Select className="" value={f.target ?? ""} onChange={setOnChange7} options={[{ value: "", label: "Select\u2026" }, ...inventory.map(renderInventory)]} />
              </Box>)}
          </Box>
          <Label className={cn("!flex !items-center !gap-2.5", "!mt-4 !gap-2.5 !cursor-pointer")}>
            <Button type="button" className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${f.online ? "!bg-mid after:!translate-x-4" : ""}`} onClick={setOnClick}/>
            <Text className={cn("!text-[13px] !font-semibold")} as="span">
              Show this offer on the customer app (online)
            </Text>
          </Label>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onClose}>
            Cancel
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={!valid} onClick={onSaveOnClick}>
            Launch offer
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setOnChange(e: ChangeEvent<HTMLInputElement>) {
        return set({ title: e.target.value });
    }
    function setOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return set({ code: e.target.value.toUpperCase() });
    }
    function setOnChange3(e: ChangeEvent<HTMLSelectElement>) {
        return set({ type: e.target.value as OfferType });
    }
    function setOnChange4(e: ChangeEvent<HTMLInputElement>) {
        return set({ value: Number(e.target.value) || 0 });
    }
    function setOnChange5(e: ChangeEvent<HTMLSelectElement>) {
        return set({ scope: e.target.value as OfferScope, target: undefined });
    }
    function setOnChange6(e: ChangeEvent<HTMLSelectElement>) {
        return set({ target: e.target.value });
    }
    function renderCATEGORIES(c: {
        key: CategoryKey;
        label: string;
    }) {
        return { value: String(c.key), label: String(c.label) };
    }
    function setOnChange7(e: ChangeEvent<HTMLSelectElement>) {
        return set({ target: e.target.value });
    }
    function renderInventory(p: InvProduct) {
        return { value: String(p.id), label: String(p.name) };
    }
    function setOnClick() {
        return set({ online: !f.online });
    }
    function onSaveOnClick() {
        return onSave(f);
    }
}
