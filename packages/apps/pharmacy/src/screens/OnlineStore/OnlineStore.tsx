import type { CategoryKey } from "@/utils";
import { Box, Button, Heading, Image, Input, Label, Select, Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { CATEGORIES, catLabel, inr, mrpOf, sellPrice, stockOf, InvProduct, Offer, OfferType, directOfferId, directOfferOf, onlineOfferPrice, } from "@/utils";
import { IconSearch, IconStore, IconX, IconGlobe, IconTag, IconBulb, IconCart, } from "@/components/Icon";
import { CategoryIcon, monogramOf } from "@/components/EntityIcon";
import { Thumb } from "@/components/Thumb";
import { catalogProducts } from "./OnlineStore.utils";
export default function OnlineStoreScreen() {
    const { inventory, offers, profile, toggleOnline, setOnlinePrice, setProductOffer, setDirectOffer, toggleStoreOpen, } = usePharma();
    const [q, setQ] = useState("");
    const [cat, setCat] = useState("all");
    const [editPrice, setEditPrice] = useState<InvProduct | null>(null);
    const [directFor, setDirectFor] = useState<InvProduct | null>(null);
    const [tab, setTab] = useState<"manage" | "preview">("manage");
    const list = catalogProducts(inventory, cat, q);
    const onlineList = inventory.filter((p) => p.online && stockOf(p) > 0);
    const liveCount = inventory.filter((p) => p.online).length;
    const hiddenCount = inventory.length - liveCount;
    const offerCount = inventory.filter((p) => p.offerId && offers.find((o) => o.id === p.offerId && o.active)).length;
    const storeOffers = offers.filter((o) => o.online && !o.id.startsWith("od-"));
    return (<Box className="!mx-auto !max-w-[1680px]">
      {/* store status banner */}
      <Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-4.5 !flex !items-center !gap-4", profile.storeOpen ? "!bg-gradient-to-r from-wash to-paper" : "!bg-rose-bg")}>
        <Box className={cn("!w-[46px] !h-[46px] !rounded-md !text-paper !grid !place-items-center", profile.storeOpen ? "!bg-mid" : "!bg-rose")}>
          <IconStore size={24}/>
        </Box>
        <Box className={cn("!flex-1")}>
          <Heading className={cn("!text-[15px]")} level={3}>
            {profile.storeOpen ? "Your online store is live" : "Online store is paused"}
          </Heading>
          <Text className={cn("!text-muted", "!text-[12.5px]")}>
            {profile.storeOpen
            ? `${onlineList.length} products visible to customers on the Namma MedMate app right now.`
            : "Customers cannot place online orders. Counter billing still works."}
          </Text>
        </Box>
        <Button onClick={toggleStoreOpen} aria-label="Toggle store" className={cn(`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${profile.storeOpen ? "!bg-mid after:!translate-x-4" : ""}`, "!scale-[1.2]")}/>
      </Box>

      <Box className="!mb-[22px] !grid !grid-cols-[repeat(auto-fit,minmax(min(100%,168px),1fr))] !gap-4">
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-wash !text-mid">
            <IconGlobe size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Live online</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{liveCount}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">visible to customers</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-amber-bg !text-gold-d"></Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">Hidden</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{hiddenCount}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">counter-only items</Box>
        </Box>
        <Box className="group !relative !flex !flex-col !overflow-hidden !rounded-md !border !border-line !bg-paper !px-[18px] !py-4 !shadow-sm">
          <Box className="!grid !h-8 !w-8 !place-items-center !rounded-[9px] !text-[17px] !bg-blue-bg !text-blue">
            <IconTag size={18}/>
          </Box>
          <Box className="!mt-3 !text-[11px] !font-bold !uppercase !tracking-[0.05em] !text-muted">On offer</Box>
          <Box className="!mt-[3px] !mb-2.5 !font-display !text-[26px] !font-extrabold !tracking-tight !text-dark !tabular-nums">{offerCount}</Box>
          <Box className="mt-auto block border-t border-line pt-[9px] text-xs text-muted">discounted online</Box>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          <Button className={tab === "manage" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick}>
            Manage listings
          </Button>
          <Button className={tab === "preview" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick2}>
            Customer preview
          </Button>
        </Box>
        <Box className="!flex-1"/>
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17}/>
          </Text>
          <Input placeholder="Search products…" value={q} onChange={setQOnChange}/>
        </Box>
      </Box>

      {tab === "manage" && (<>
          <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2", "!mb-3.5")}>
            <Button className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${cat === "all" ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setCatOnClick}>
              All
            </Button>
            {CATEGORIES.map(renderCATEGORIES)}
          </Box>
          <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
            <Box className="!overflow-x-auto">
              <Table className="!w-full !border-separate !border-spacing-0 !text-[13px] [&_th]:!sticky [&_th]:!top-0 [&_th]:!border-b [&_th]:!border-line [&_th]:!bg-wash-2 [&_th]:!px-3.5 [&_th]:!py-[11px] [&_th]:!text-left [&_th]:!text-[10.5px] [&_th]:!font-bold [&_th]:!uppercase [&_th]:!tracking-[0.07em] [&_th]:!whitespace-nowrap [&_th]:!text-muted [&_td]:!border-b [&_td]:!border-line [&_td]:!px-3.5 [&_td]:!py-[11px] [&_td]:!align-middle [&_td]:!text-ink-2">
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Product</TableHeaderCell>
                    <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">MRP</TableHeaderCell>
                    <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Online price</TableHeaderCell>
                    <TableHeaderCell>Offer</TableHeaderCell>
                    <TableHeaderCell className="text-right tabular-nums font-semibold text-ink">Customer pays</TableHeaderCell>
                    <TableHeaderCell>Show online</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {list.map(renderList)}
                </TableBody>
              </Table>
            </Box>
          </Box>
          <Text className={cn("!text-muted", "!text-[12.5px] !mt-3")}>
            <IconBulb size={13}/> Turn a product off to keep it counter-only. Set an online price,
            attach a store offer, or use Direct for a discount on that product only.
          </Text>
        </>)}

      {tab === "preview" && (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]">
          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-3.5")}>
            <Box>
              <Heading className={cn("!text-[15px]")} level={3}>{profile.name}</Heading>
              <Text className={cn("!text-muted", "!text-[12.5px]")}>
                As customers see it — this dashboard preview, not a separate storefront
              </Text>
            </Box>
          </Box>
          {onlineList.length === 0 ? (<Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
              <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid">
                <IconCart size={30}/>
              </Box>
              <Text>No products are live online yet. Toggle some on in “Manage listings”.</Text>
            </Box>) : (<Box className={cn("!grid !grid-cols-[repeat(auto-fill,minmax(160px,1fr))] !gap-3.5")}>
              {onlineList.map(renderOnlineList)}
            </Box>)}
        </Box>)}

      {editPrice && (<PriceModal product={editPrice} onClose={setEditPriceOnClose} onSave={setOnlinePriceOnSave}/>)}
      {directFor && (<DirectModal product={directFor} offer={directOfferOf(directFor, offers)} onClose={setDirectForOnClose} onSave={setDirectOfferOnSave}/>)}
    </Box>);
    function setTabOnClick() {
        return setTab("manage");
    }
    function setTabOnClick2() {
        return setTab("preview");
    }
    function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setQ(e.target.value);
    }
    function setCatOnClick() {
        return setCat("all");
    }
    function renderCATEGORIES(c: {
        key: CategoryKey;
        label: string;
    }) {
        return (<Button key={c.key} className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${cat === c.key ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`} onClick={setCatOnClick2}>
                <CategoryIcon k={c.key} size={15}/> {c.label}
              </Button>);
        function setCatOnClick2() {
            return setCat(c.key);
        }
    }
    function renderList(p: InvProduct) {
        const price = onlineOfferPrice(p, offers);
        const base = sellPrice(p);
        const off = base - price;
        const direct = directOfferOf(p, offers);
        const out = stockOf(p) <= 0;
        return (<TableRow key={p.id} className={cn(p.online ? "!opacity-[1]" : "!opacity-[0.55]")}>
                        <TableCell>
                          <Box className="flex items-center gap-2.5">
                            <Text className="inline-grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-wash text-[17px] font-display font-bold leading-none text-mid" as="span">
                              <Thumb p={p}/>
                            </Text>
                            <Text as="span">
                              <Text className="!font-bold !text-ink" as="span">{p.name}</Text>
                              <Box className="text-[11.5px] text-muted">
                                {catLabel(p.category)} · {p.pack}
                                {out ? " · out of stock" : ""}
                              </Box>
                            </Text>
                          </Box>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-ink">{inr(mrpOf(p))}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-ink">
                          <Button onClick={setEditPriceOnClick} className={cn("!grid !h-8 !w-8 !place-items-center !rounded-xs !border !border-line-2 !bg-paper !text-ink-2 hover:!bg-wash-2 hover:!text-mid", "!w-auto !py-[5px] !px-2.5 !font-bold")}>
                            {p.onlinePrice ? (inr(p.onlinePrice)) : (<Text className="!text-muted" as="span">= MRP</Text>)}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Box className="!flex !items-center !gap-1.5">
                            <Select value={p.offerId && p.offerId !== directOfferId(p.id) ? p.offerId : ""} onChange={setProductOfferOnChange} className={cn("!bg-[position:right_7px_center] !py-[5px] !pr-[30px] !pl-2 !text-[12.5px]", "!max-w-[150px]")} options={[{ value: "", label: "No store offer" }, ...storeOffers.map(renderStoreOffer)]} />
                            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2 !h-auto !rounded-xs !px-[11px] !py-1.5 !text-xs" onClick={setDirectForOnClick}>
                              {direct
                ? direct.type === "pct"
                    ? `${direct.value}%`
                    : `₹${direct.value}`
                : "Direct"}
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-semibold text-ink">
                          {off > 0 ? (<Text as="span">
                              <Text as="span" className={cn("font-bold", "!text-green")}>{inr(price)}</Text>{" "}
                              <Text className="!text-xs !font-semibold !text-faint !line-through" as="span">{inr(base)}</Text>
                            </Text>) : (<Text as="span" className="font-bold">{inr(price)}</Text>)}
                        </TableCell>
                        <TableCell>
                          <Button className={`!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !bg-[#cddcd3] !p-0 !shadow-none after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow after:!transition after:!content-['']${p.online ? "!bg-mid after:!translate-x-4" : ""}`} onClick={toggleOnlineOnClick} aria-label="Toggle online"/>
                        </TableCell>
                      </TableRow>);
        function setEditPriceOnClick() {
            return setEditPrice(p);
        }
        function setProductOfferOnChange(e: ChangeEvent<HTMLSelectElement>) {
            const id = e.target.value;
            if (id)
                setProductOffer(p.id, id);
            else if (direct)
                setDirectOffer(p.id, direct.type, direct.value);
            else
                setProductOffer(p.id, undefined);
        }
        function renderStoreOffer(o: Offer) {
            return { value: String(o.id), label: String(o.title) };
        }
        function setDirectForOnClick() {
            return setDirectFor(p);
        }
        function toggleOnlineOnClick() {
            return toggleOnline(p.id);
        }
    }
    function renderOnlineList(p: InvProduct) {
        const price = onlineOfferPrice(p, offers);
        const base = sellPrice(p);
        const off = base - price;
        return (<Box key={p.id} className={cn("!border !border-line !rounded-[14px] !p-3 !relative !bg-paper")}>
                    {off > 0 && (<Text className={cn("!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold !bg-rose-bg !text-rose", "!absolute !top-2 !left-2")} as="span">
                        {Math.round((off / base) * 100)}% OFF
                      </Text>)}
                    <Box className={cn("!h-[70px] !rounded-[10px] !bg-wash !grid !place-items-center !text-[34px] !mb-2 !overflow-hidden")}>
                      {p.image ? (<Image className="!block !h-full !w-full !rounded-[inherit] !object-cover" src={p.image} alt={p.name}/>) : (monogramOf(p.name))}
                    </Box>
                    <Box className={cn("!font-bold !text-[13px] !leading-[1.25]")}>{p.name}</Box>
                    <Box className={cn("!text-[11px] !text-muted")}>{p.pack}</Box>
                    <Box className={cn("!flex !items-center !gap-2.5", "!mt-2 !justify-between")}>
                      <Text as="span">
                        <Text as="span" className={cn("font-bold", "!font-display !text-[15px] !text-dark")}>
                          {inr(price)}
                        </Text>{" "}
                        {off > 0 && <Text className="!text-xs !font-semibold !text-faint !line-through" as="span">{inr(base)}</Text>}
                      </Text>
                      <Text className={cn("!text-[11px] !font-extrabold !text-green !border !border-mint !rounded-[7px] !py-[3px] !px-2")} as="span">
                        ADD
                      </Text>
                    </Box>
                  </Box>);
    }
    function setEditPriceOnClose() {
        return setEditPrice(null);
    }
    async function setOnlinePriceOnSave(price: number | undefined) {
        if (!editPrice) return;
        const err = await setOnlinePrice(editPrice.id, price);
        if (!err)
            setEditPrice(null);
    }
    function setDirectForOnClose() {
        return setDirectFor(null);
    }
    function setDirectOfferOnSave(type: OfferType, value: number) {
        if (!directFor) return;
        setDirectOffer(directFor.id, type, value);
        setDirectFor(null);
    }
}
function DirectModal({ product, offer, onClose, onSave, }: {
    product: InvProduct;
    offer?: Offer;
    onClose: () => void;
    onSave: (type: OfferType, value: number) => void;
}) {
    const [type, setType] = useState<OfferType>(offer?.type ?? "pct");
    const [val, setVal] = useState(offer ? String(offer.value) : "");
    const value = Number(val) || 0;
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick} className={cn("!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[420px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Direct offer · {product.name}</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Text className={cn("!text-muted", "!text-[13px] !mb-3.5")}>
            A discount for this product only. It replaces the store offer on the customer price.
          </Text>
          <Box className="!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Type</Label>
              <Select className="" value={type} onChange={setTypeOnChange} options={[{ value: "pct", label: "Percentage %" }, { value: "flat", label: "Flat \u20b9" }]} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>{type === "pct" ? "Percent off" : "Amount off (₹)"}</Label>
              <Input className="" type="number" min={0} value={val} onChange={setValOnChange}/>
            </Box>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onSaveOnClick}>
            Clear
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" disabled={value <= 0} onClick={onSaveOnClick2}>
            Save offer
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setTypeOnChange(e: ChangeEvent<HTMLSelectElement>) {
        return setType(e.target.value as OfferType);
    }
    function setValOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setVal(e.target.value);
    }
    function onSaveOnClick() {
        return onSave(type, 0);
    }
    function onSaveOnClick2() {
        return onSave(type, value);
    }
}
function PriceModal({ product, onClose, onSave, }: {
    product: InvProduct;
    onClose: () => void;
    onSave: (p: number | undefined) => void;
}) {
    const [val, setVal] = useState<string>(product.onlinePrice ? String(product.onlinePrice) : "");
    return (<Box className="!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]" onClick={onClose}>
      <Box onClick={stopPropagationOnClick2} className={cn("!flex !max-h-[90vh] !w-full !max-w-[540px] !flex-col !overflow-hidden !rounded-lg !bg-paper !shadow-pop", "!max-w-[420px]")}>
        <Box className="!flex !items-center !justify-between !border-b !border-line !px-5 !py-4 [&_h3]:!text-[17px]">
          <Heading level={3}>Online price · {product.name}</Heading>
          <Button className="!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash" onClick={onClose}>
            <IconX size={18}/>
          </Button>
        </Box>
        <Box className="!overflow-y-auto !p-5">
          <Text className={cn("!text-muted", "!text-[13px] !mb-3.5")}>
            Printed MRP is <Text as="span" className="font-bold">{inr(mrpOf(product))}</Text>. Set a lower online selling price, or leave
            blank to sell at MRP.
          </Text>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="amount">
            <Label>Online selling price (₹)</Label>
            <Input className="" type="number" autoFocus value={val} onChange={setValOnChange2} placeholder={String(mrpOf(product))}/>
          </Box>
        </Box>
        <Box className="!mt-auto !flex !justify-end !gap-2.5 !border-t !border-line !px-5 !py-3.5">
          <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={onSaveOnClick3}>
            Reset to MRP
          </Button>
          <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={onSaveOnClick4}>
            Save price
          </Button>
        </Box>
      </Box>
    </Box>);
    function stopPropagationOnClick2(e: MouseEvent<HTMLDivElement>) {
        return e.stopPropagation();
    }
    function setValOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return setVal(e.target.value);
    }
    function onSaveOnClick3() {
        return onSave(undefined);
    }
    function onSaveOnClick4() {
        return onSave(val ? Number(val) : undefined);
    }
}
