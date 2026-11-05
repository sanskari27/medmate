import type { CategoryKey } from "@/utils";
import { Box, Button, Heading, Input, Label, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent, MouseEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { kioskProducts, nextPayModes } from "./Kiosk.utils";
import {
  CATEGORIES,
  inr,
  inr2,
  billUnit,
  totalUnits,
  looseSellable,
  unitNoun,
  PayMode,
  PAY_LABEL,
  InvProduct,
} from "@/utils";
import { IconKiosk, IconX, IconCheck, IconHash, IconCart } from "@/components/atoms";
import { CategoryIcon } from "@/components/molecules";
import { Thumb } from "@/components/molecules";
import { ColorFill } from "@/components/molecules/BarChart";
const ACCENTS: Record<string, string> = {
  green: "linear-gradient(135deg,#1B3D29,#3D8B60)",
  dark: "linear-gradient(135deg,#0c2516,#11331f)",
  gold: "linear-gradient(135deg,#8a5a12,#D9A648)",
};
export default function KioskScreen() {
  const { kiosk, updateKiosk } = usePharma();
  const [preview, setPreview] = useState(false);
  const togglePay = (m: PayMode) => {
    updateKiosk({ payModes: nextPayModes(kiosk.payModes, m) });
  };
  return (
    <Box className={cn("!mx-auto !max-w-[1680px]", "!max-w-[920px]")}>
      <Box
        className={cn(
          "!mb-4 !flex !flex-row !flex-wrap !items-center !gap-4 !rounded-md !border !border-line !bg-paper !p-[18px] !shadow-sm",
          kiosk.enabled ? "!bg-[linear-gradient(100deg,var(--color-wash),#fff)]" : "!bg-rose-bg",
        )}
      >
        <Box
          className={cn(
            "!w-[46px] !h-[46px] !rounded-md !text-paper !grid !place-items-center",
            kiosk.enabled ? "!bg-mid" : "!bg-rose",
          )}
        >
          <IconKiosk size={24} />
        </Box>
        <Box className={cn("!flex-1")}>
          <Heading className={cn("!text-[15px]")} level={3}>
            {kiosk.enabled ? "Self-order kiosk is enabled" : "Kiosk disabled"}
          </Heading>
          <Text className={cn("!text-muted", "!text-[12.5px]")}>
            McDonald’s-style in-store screen where customers browse & order themselves; orders land
            at your counter.
          </Text>
        </Box>
        <Button
          className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
          onClick={setPreviewOnClick}
        >
          ▶ Launch preview
        </Button>
        <Button
          onClick={updateKioskOnClick}
          aria-label="Toggle kiosk"
          className={cn(
            cn(
              "!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !p-0 !shadow-none active:!translate-y-0 after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:!transition after:!content-['']",
              kiosk.enabled
                ? "!bg-mid hover:!bg-mid after:!translate-x-4"
                : "!bg-[#cddcd3] hover:!bg-[#cddcd3]",
            ),
            "!scale-[1.2]",
          )}
        />
      </Box>

      <Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm">
        <Box className="!flex !flex-wrap !items-center !justify-between !gap-2.5 !border-b !border-line !px-[18px] !py-[15px] [&_h3]:!text-[15px] [&_h3]:!font-bold">
          <Heading level={3}>Kiosk configuration</Heading>
        </Box>
        <Box className="!flex-1 !p-[18px]">
          <Box className="!grid !grid-cols-2 !gap-3.5 max-[767px]:!grid-cols-1">
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Display name (shown on kiosk)</Label>
              <Input className="" value={kiosk.displayName} onChange={updateKioskOnChange} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Welcome message</Label>
              <Input className="" value={kiosk.welcome} onChange={updateKioskOnChange2} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Staff exit PIN</Label>
              <Input
                className="!font-mono"
                value={kiosk.pin}
                maxLength={6}
                onChange={updateKioskOnChange3}
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Idle reset (seconds)</Label>
              <Input
                className=""
                type="number"
                value={kiosk.idleResetSec}
                onChange={updateKioskOnChange4}
              />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2 !col-span-2 max-[767px]:!col-span-1">
              <Label>Accent theme</Label>
              <Box className="!flex !items-center !gap-1.5">
                {(["green", "dark", "gold"] as const).map(renderA)}
              </Box>
            </Box>
          </Box>

          <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
            Customer options
          </Box>
          <ToggleRow
            label="Show prices on kiosk"
            on={kiosk.showPrices}
            onClick={updateKioskOnClick3}
          />
          <ToggleRow
            label="Allow prescription upload at kiosk"
            on={kiosk.allowRx}
            onClick={updateKioskOnClick4}
          />

          <Box className="!mt-4 !mb-0.5 !text-[11px] !font-extrabold !tracking-[0.08em] !text-faint !uppercase first:!mt-0">
            Accepted payments at kiosk
          </Box>
          <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap")}>
            {(["cash", "upi", "card", "cod"] as PayMode[]).map(renderM)}
          </Box>
          <Text className={cn("!text-muted", "!text-[12px] !mt-2.5")}>
            Only products that are{" "}
            <Text as="span" className="font-bold">
              live online & in stock
            </Text>{" "}
            appear on the kiosk. Manage which in{" "}
            <Text as="span" className="font-bold">
              Online Store
            </Text>
            . Kiosk orders are recorded as counter sales and deduct stock automatically.
          </Text>
        </Box>
      </Box>

      {preview && <KioskPreview onClose={setPreviewOnClose} />}
    </Box>
  );
  function setPreviewOnClick() {
    return setPreview(true);
  }
  function updateKioskOnClick() {
    return updateKiosk({ enabled: !kiosk.enabled });
  }
  function updateKioskOnChange(e: ChangeEvent<HTMLInputElement>) {
    return updateKiosk({ displayName: e.target.value });
  }
  function updateKioskOnChange2(e: ChangeEvent<HTMLInputElement>) {
    return updateKiosk({ welcome: e.target.value });
  }
  function updateKioskOnChange3(e: ChangeEvent<HTMLInputElement>) {
    return updateKiosk({ pin: e.target.value });
  }
  function updateKioskOnChange4(e: ChangeEvent<HTMLInputElement>) {
    return updateKiosk({ idleResetSec: Number(e.target.value) || 0 });
  }
  function renderA(a: "gold" | "green" | "dark") {
    return (
      <Button
        key={a}
        onClick={updateKioskOnClick2}
        className={cn(
          `!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${kiosk.accent === a ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`,
          "!capitalize",
        )}
      >
        {a}
      </Button>
    );
    function updateKioskOnClick2() {
      return updateKiosk({ accent: a });
    }
  }
  function updateKioskOnClick3() {
    return updateKiosk({ showPrices: !kiosk.showPrices });
  }
  function updateKioskOnClick4() {
    return updateKiosk({ allowRx: !kiosk.allowRx });
  }
  function renderM(m: PayMode) {
    return (
      <Button
        key={m}
        className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${kiosk.payModes.includes(m) ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
        onClick={togglePayOnClick}
      >
        {PAY_LABEL[m]}
      </Button>
    );
    function togglePayOnClick() {
      return togglePay(m);
    }
  }
  function setPreviewOnClose() {
    return setPreview(false);
  }
}
function ToggleRow({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <Box
      className={cn(
        "!flex !items-center !gap-2.5",
        "!justify-between !py-2.5 !px-0 !border-b !border-line",
      )}
    >
      <Text className={cn("!text-[13.5px] !font-semibold")} as="span">
        {label}
      </Text>
      <Button
        className={cn(
          "!relative !h-[22px] !w-[38px] !shrink-0 !rounded-full !border-0 !p-0 !shadow-none active:!translate-y-0 after:!absolute after:!top-0.5 after:!left-0.5 after:!h-[18px] after:!w-[18px] after:!rounded-full after:!bg-white after:!shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:!transition after:!content-['']",
          on ? "!bg-mid hover:!bg-mid after:!translate-x-4" : "!bg-[#cddcd3] hover:!bg-[#cddcd3]",
        )}
        onClick={onClick}
      />
    </Box>
  );
}
// ── functional kiosk preview (Mc-model self order) ──────────────
function KioskPreview({ onClose }: { onClose: () => void }) {
  const { inventory, kiosk, placeKioskOrder } = usePharma();
  const [cat, setCat] = useState("all");
  const [cart, setCart] = useState<
    {
      productId: string;
      qty: number;
      loose: boolean;
    }[]
  >([]);
  const [pay, setPay] = useState<PayMode>(kiosk.payModes[0] ?? "cash");
  const [done, setDone] = useState<string | null>(null);
  const products = kioskProducts(inventory, cat, totalUnits);
  const same = (
    l: {
      productId: string;
      loose: boolean;
    },
    id: string,
    loose: boolean,
  ) => l.productId === id && l.loose === loose;
  const add = (id: string, loose = false) =>
    setCart((c) =>
      c.some((x) => same(x, id, loose))
        ? c.map((x) => (same(x, id, loose) ? { ...x, qty: x.qty + 1 } : x))
        : [...c, { productId: id, qty: 1, loose }],
    );
  const dec = (id: string, loose = false) =>
    setCart((c) =>
      c.flatMap((x) => (same(x, id, loose) ? (x.qty > 1 ? [{ ...x, qty: x.qty - 1 }] : []) : [x])),
    );
  const unitPrice = (p: InvProduct, loose: boolean) => billUnit(p, { loose }).price;
  const items = cart
    .map((l) => {
      const p = inventory.find((x) => x.id === l.productId);
      return p ? { p, qty: l.qty, loose: l.loose } : null;
    })
    .filter(Boolean) as {
    p: InvProduct;
    qty: number;
    loose: boolean;
  }[];
  const total = items.reduce((a, x) => a + unitPrice(x.p, x.loose) * x.qty, 0);
  const count = items.reduce((a, x) => a + x.qty, 0);
  const packQty = (id: string) => cart.find((x) => x.productId === id && !x.loose)?.qty ?? 0;
  const looseQty = (id: string) => cart.find((x) => x.productId === id && x.loose)?.qty ?? 0;
  const place = async () => {
    const s = await placeKioskOrder(cart, pay);
    if (s) {
      setDone(s.id);
      setCart([]);
    }
  };
  return (
    <Box
      onClick={onClose}
      className={cn(
        "!fixed !inset-0 !z-[100] !flex !items-center !justify-center !bg-[rgba(13,32,21,0.5)] !p-6 !backdrop-blur-[3px]",
        "!p-0",
      )}
    >
      <Box
        onClick={stopPropagationOnClick}
        className={cn(
          "!w-full !max-w-[1000px] !h-[92vh] !rounded-[18px] !overflow-hidden !bg-paper !flex !flex-col",
        )}
      >
        {/* kiosk header */}
        <Box
          className={cn(
            "!relative !flex !items-center !justify-between !px-[22px] !py-4 !text-paper",
          )}
        >
          <ColorFill
            color={ACCENTS[kiosk.accent] ?? ACCENTS.green}
            className="pointer-events-none absolute inset-0 h-full w-full"
          />
          <Box className="!relative">
            <Box className={cn("!font-display !font-extrabold !text-[20px]")}>
              {kiosk.displayName}
            </Box>
            <Box className={cn("!text-[12.5px] !opacity-[0.85]")}>{kiosk.welcome}</Box>
          </Box>
          <Button
            onClick={onClose}
            className={cn(
              "!grid !h-8 !w-8 !place-items-center !rounded-sm !border-0 !bg-wash-2 !text-lg !text-ink-2 !shadow-none hover:!bg-wash",
              "!relative !bg-paper/20 !text-paper",
            )}
          >
            <IconX size={18} />
          </Button>
        </Box>

        {done ? (
          <Box
            className={cn(
              "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
              "!flex-1 !grid !place-items-center",
            )}
          >
            <Box>
              <Box
                className={cn(
                  "mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-[21px] leading-none text-mid",
                  "!text-[60px]",
                )}
              >
                <IconCheck size={60} />
              </Box>
              <Heading className={cn("!text-[22px]")} level={3}>
                Order placed!
              </Heading>
              <Text className={cn("!text-[15px]")}>
                Token{" "}
                <Text as="span" className="font-bold">
                  {done}
                </Text>{" "}
                — please collect & pay at the counter.
              </Text>
              <Button
                onClick={setDoneOnClick}
                className={cn(
                  "!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-sm !px-[22px] !py-[13px] !text-[14.5px]",
                  "!mt-4.5",
                )}
              >
                Start new order
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="!grid !min-h-0 !flex-1 !grid-cols-[minmax(0,1fr)_minmax(220px,320px)] !overflow-hidden max-[767px]:!grid-cols-1">
            {/* products */}
            <Box className={cn("!overflow-y-auto !p-4.5")}>
              <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2", "!mb-3.5")}>
                <Button
                  className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${cat === "all" ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
                  onClick={setCatOnClick}
                >
                  All
                </Button>
                {CATEGORIES.map(renderCATEGORIES)}
              </Box>
              <Box className={cn("!grid !grid-cols-[repeat(auto-fill,minmax(150px,1fr))] !gap-3")}>
                {products.map(renderProduct)}
              </Box>
            </Box>
            {/* cart */}
            <Box className={cn("!border-l !border-line !flex !flex-col !bg-wash-2")}>
              <Box
                className={cn(
                  "!py-3.5 !px-4 !border-b !border-line !font-display !font-extrabold !text-[16px]",
                )}
              >
                <IconCart size={16} /> Your order {count > 0 && `· ${count}`}
              </Box>
              <Box className={cn("!flex-1 !overflow-y-auto !py-1.5 !px-4")}>
                {items.length === 0 ? (
                  <Box
                    className={cn(
                      "!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink",
                      "!p-[30px]",
                    )}
                  >
                    <Text>Tap products to add them.</Text>
                  </Box>
                ) : (
                  items.map(renderItem)
                )}
              </Box>
              <Box className={cn("!p-4 !border-t !border-line")}>
                {kiosk.showPrices && (
                  <Box
                    className={cn(
                      "!flex !items-center !justify-between !py-1.5 !text-[13px] font-display text-[18px] font-extrabold text-dark",
                      "!border-t-0 !mt-0 !pt-0",
                    )}
                  >
                    <Text as="span">Total</Text>
                    <Text as="span">{inr(total)}</Text>
                  </Box>
                )}
                <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap !my-2.5 !mx-0")}>
                  {kiosk.payModes.map(renderPayMode)}
                </Box>
                <Button
                  className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green !h-auto !rounded-sm !px-[22px] !py-[13px] !text-[14.5px] !w-full"
                  disabled={count === 0}
                  onClick={place}
                >
                  <IconCheck size={17} /> Place order
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
  function stopPropagationOnClick(e: MouseEvent<HTMLDivElement>) {
    return e.stopPropagation();
  }
  function setDoneOnClick() {
    return setDone(null);
  }
  function setCatOnClick() {
    return setCat("all");
  }
  function renderCATEGORIES(c: { key: CategoryKey; label: string }) {
    return (
      <Button
        key={c.key}
        className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${cat === c.key ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
        onClick={setCatOnClick2}
      >
        <CategoryIcon k={c.key} size={15} /> {c.label}
      </Button>
    );
    function setCatOnClick2() {
      return setCat(c.key);
    }
  }
  function renderProduct(p: InvProduct) {
    const n = packQty(p.id),
      ln = looseQty(p.id);
    return (
      <Button
        key={p.id}
        className="!relative !flex !h-auto !w-full !flex-col !items-stretch !justify-start !rounded-md !border !border-line !bg-paper !p-3 !text-left !font-normal !shadow-none hover:!border-mint hover:!bg-paper hover:!shadow-sm"
        onClick={addOnClick}
      >
        {n > 0 && (
          <Text
            className="absolute top-2 right-2 grid h-5 min-w-5 place-items-center rounded-[10px] bg-mid px-[5px] text-[11px] font-extrabold text-white"
            as="span"
          >
            {n}
          </Text>
        )}
        <Box
          className={cn(
            "mb-[9px] grid h-10 w-10 place-items-center rounded-[10px] bg-wash text-[20px] text-mid",
            "!w-12 !h-12 !text-[24px] !overflow-hidden",
          )}
        >
          <Thumb p={p} />
        </Box>
        <Box className="!min-h-[33px] !text-[13px] !font-bold !leading-tight !text-ink">
          {p.name}
        </Box>
        <Box className="mt-0.5 text-[11px] text-muted">{p.pack}</Box>
        {kiosk.showPrices && (
          <Box className="mt-2 font-display text-[14px] font-extrabold tabular-nums text-dark">
            {inr(unitPrice(p, false))}
          </Box>
        )}
        {looseSellable(p) && (
          <Text
            className={cn(
              "mt-[7px] inline-flex max-w-full items-center gap-1 overflow-hidden rounded-[7px] border border-mint bg-wash px-[7px] py-1 text-[10px] font-bold leading-tight text-ellipsis whitespace-nowrap text-mid hover:bg-mint hover:text-deep",
              ln > 0 && "!border-mid !bg-mid !text-white hover:!bg-mid hover:!text-white",
            )}
            role="button"
            title={`Add a single ${unitNoun(p)}`}
            onClick={stopPropagationOnClick2}
            as="span"
          >
            <IconHash size={13} /> 1 {unitNoun(p)}
            {kiosk.showPrices ? ` · ${inr2(unitPrice(p, true))}` : ""}
            {ln > 0 ? ` · ${ln}` : ""}
          </Text>
        )}
      </Button>
    );
    function addOnClick() {
      return add(p.id);
    }
    function stopPropagationOnClick2(e: MouseEvent<HTMLSpanElement>) {
      e.stopPropagation();
      add(p.id, true);
    }
  }
  function renderItem({ p, qty, loose }: { p: InvProduct; qty: number; loose: boolean }) {
    return (
      <Box
        className="!flex !items-center !justify-between !gap-2 !py-1.5"
        key={p.id + (loose ? "-loose" : "")}
      >
        <Box className="min-w-0 flex-1 overflow-hidden">
          <Box className="!text-[13px] !font-bold !leading-tight">
            {p.name}{" "}
            {loose && (
              <Text
                className="!inline-flex !items-center !gap-1 !rounded-xs !border !border-line-2 !bg-paper !px-[7px] !py-0.5 !text-[10.5px] !font-bold !text-ink-2"
                as="span"
              >
                loose
              </Text>
            )}
          </Box>
          {kiosk.showPrices && (
            <Box className="mt-0.5 text-[11px] text-muted">
              {inr2(unitPrice(p, loose))}
              {loose ? `/${unitNoun(p)}` : ""}
            </Box>
          )}
        </Box>
        <Box
          className="!inline-flex !items-center !overflow-hidden !rounded-sm !border !border-line-2"
          data-field="qty"
        >
          <Button onClick={decOnClick}>−</Button>
          <Text as="span">{qty}</Text>
          <Button onClick={addOnClick2}>+</Button>
        </Box>
      </Box>
    );
    function decOnClick() {
      return dec(p.id, loose);
    }
    function addOnClick2() {
      return add(p.id, loose);
    }
  }
  function renderPayMode(m: PayMode) {
    return (
      <Button
        key={m}
        className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 ${pay === m ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
        onClick={setPayOnClick}
      >
        {PAY_LABEL[m]}
      </Button>
    );
    function setPayOnClick() {
      return setPay(m);
    }
  }
}
