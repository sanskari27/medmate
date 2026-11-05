import { useEffect, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent } from "react";
import { usePharma } from "@/hooks";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Input } from "@/components/atoms/Input";
import { MonoText } from "@/components/atoms/MonoText";
import { Pill } from "@/components/atoms/Pill";
import { Progress } from "@/components/atoms/Progress";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import {
  IconBox,
  IconCamera,
  IconCheck,
  IconPill,
  IconPrint,
  IconTruck,
  IconX,
} from "@/components/atoms/Icon";
import { Field } from "@/components/molecules/Field";
import { Thumb } from "@/components/Thumb";
import Invoice from "@/components/Invoice";
import {
  computeInvoice,
  fmtDateTime,
  inr,
  packComplete,
  packDone,
  packTotal,
  type InvProduct,
  type PackLine,
  type Sale,
} from "@/utils";
import { cn } from "@/utils/className";
import { packRailTone, packStepOf, type PackStep } from "../../Orders.utils";
import type { PackOrderProps } from "./PackOrder.types";

const PACK_RAIL: { key: PackStep; label: string }[] = [
  { key: "pack", label: "Scan & pack" },
  { key: "handover", label: "Seal packet" },
  { key: "done", label: "Hand to delivery" },
];

export default function PackOrder({ saleId, onClose }: PackOrderProps) {
  const {
    sales,
    inventory,
    profile,
    startPacking,
    scanPackLine,
    pickPackLine,
    sealPacket,
    handToRider,
    advanceOrder,
    toast,
  } = usePharma();
  const sale = sales.find(function same(item) {
    return item.id === saleId;
  }) ?? null;
  const [scan, setScan] = useState("");
  const [rider, setRider] = useState({ name: "", phone: "", vehicle: "" });

  useEffect(function beginPacking() {
    startPacking(saleId);
  }, [saleId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(function syncRider() {
    const assigned = sale?.fulfillment?.rider;
    if (!assigned) return;
    setRider(function merge(current) {
      return { ...current, ...assigned };
    });
  }, [sale?.fulfillment?.rider]);

  function changeScan(event: ChangeEvent<HTMLInputElement>) {
    setScan(event.target.value);
  }
  function changeName(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setRider(function update(current) {
      return { ...current, name: value };
    });
  }
  function changePhone(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setRider(function update(current) {
      return { ...current, phone: value };
    });
  }
  function changeVehicle(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setRider(function update(current) {
      return { ...current, vehicle: value };
    });
  }
  async function doScan() {
    const code = scan.trim();
    if (!code) return;
    const result = await scanPackLine(saleId, code);
    if (result) toast(`${result.name} · batch ${result.batchNo} · ${result.scanned}/${result.qty}`);
    setScan("");
  }
  function addScan() {
    void doScan();
  }
  function submitOnEnter(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addScan();
  }
  function keepOpen(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }
  function seal() {
    sealPacket(saleId);
  }
  function handOver() {
    handToRider(saleId, {
      name: rider.name.trim(),
      phone: rider.phone.trim() || undefined,
      vehicle: rider.vehicle.trim() || undefined,
    });
  }
  function markDelivered() {
    advanceOrder(saleId);
  }
  function printPacket() {
    window.print();
  }
  function productOf(id: string) {
    return inventory.find(function same(product) {
      return product.id === id;
    });
  }
  function pick(productId: string, delta: number) {
    pickPackLine(saleId, productId, delta);
  }

  if (!sale) return null;
  const totals = computeInvoice(sale.items, sale.discount);
  const done = packDone(sale);
  const total = packTotal(sale);
  const ready = packComplete(sale);
  const lines = sale.fulfillment?.lines ?? [];
  const step = packStepOf(sale.status);
  function renderLine(line: PackLine) {
    return <PackLineRow key={line.productId} line={line} product={productOf(line.productId)} onPick={pick} />;
  }

  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={`Pack & dispatch · ${sale.id}`}
        className="flex max-h-[90vh] w-full max-w-[720px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={keepOpen}
      >
        <Stack direction="row" align="start" justify="between" className="border-b border-line px-5 py-4 print:hidden">
          <Box>
            <Heading level={3} className="text-[17px]">
              Pack & dispatch · <MonoText size="sm">{sale.id}</MonoText>
            </Heading>
            <Text variant="muted" className="mt-[3px] text-[12.5px]">
              {sale.customer.name}
              {sale.customer.phone ? ` · ${sale.customer.phone}` : ""}
              {sale.customer.address ? ` · ${sale.customer.address}` : ""}
            </Text>
          </Box>
          <IconButton label="Close" className="border-0 bg-wash-2" onClick={onClose}>
            <IconX size={18} />
          </IconButton>
        </Stack>
        <Box className="px-5 pt-3 print:hidden">
          <PackRail current={step} />
        </Box>
        <Box className="overflow-y-auto px-5 py-5">
          {step === "pack" ? (
            <>
              <Stack direction="row" align="center" justify="between" className="mb-2">
                <Text as="span" className="text-[13.5px] font-bold">
                  Scan each medicine to pack
                </Text>
                <Text variant="muted" className="text-[12.5px]">
                  {done} / {total} units packed
                </Text>
              </Stack>
              <Progress value={total ? (done / total) * 100 : 0} label="Units packed" />
              <Stack
                direction="row"
                align="center"
                gap={2}
                className="my-3 rounded-sm border-[1.5px] border-mid bg-wash-2 py-1 pr-1.5 pl-[11px]"
              >
                <Box className="text-ink">
                  <IconCamera size={15} />
                </Box>
                <Input
                  variant="plain"
                  autoFocus
                  placeholder="Scan barcode / type batch no. + Enter"
                  value={scan}
                  onChange={changeScan}
                  onKeyDown={submitOnEnter}
                  className="py-1.5 text-[13.5px]"
                />
                <Button variant="primary" size="sm" onClick={addScan} disabled={!scan.trim()}>
                  Add
                </Button>
              </Stack>
              <Box className="overflow-hidden rounded-md border border-line bg-paper shadow-sm">
                {lines.map(renderLine)}
              </Box>
              <Text variant="muted" className="mt-2.5 text-[11.5px]">
                Scanning deducts the exact batch from inventory automatically. Scanner not working? Use −/+ to pick
                manually (FEFO — earliest expiry first).
              </Text>
            </>
          ) : null}
          {step === "handover" ? (
            <>
              <Stack direction="row" align="center" gap={3} className="mb-4 rounded-md border border-line bg-wash-2 p-[18px] shadow-sm">
                <IconBox size={24} />
                <Box className="flex-1">
                  <Text as="span" className="text-[14px] font-bold">
                    Packed & invoice generated
                  </Text>
                  <Text variant="muted" className="text-[12px]">
                    {total} units sealed in a Namma MedMate packet · invoice {inr(totals.payable)}
                    {sale.fulfillment?.sealedAt ? ` · ${fmtDateTime(sale.fulfillment.sealedAt)}` : ""}
                  </Text>
                </Box>
                <Button variant="ghost" size="sm" onClick={printPacket}>
                  <IconPrint size={14} /> Print invoice
                </Button>
              </Stack>
              <Text variant="label" className="text-[11px] tracking-[0.08em] text-faint uppercase">
                Assign delivery partner
              </Text>
              <Box className="mt-2 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field label="Delivery partner name" htmlFor="pack-rider-name" className="sm:col-span-2">
                  <Input
                    id="pack-rider-name"
                    autoFocus
                    value={rider.name}
                    onChange={changeName}
                    placeholder="e.g. Suresh (rider)"
                  />
                </Field>
                <Field label="Phone" htmlFor="pack-rider-phone">
                  <Input
                    id="pack-rider-phone"
                    value={rider.phone}
                    onChange={changePhone}
                    placeholder="+91 …"
                    inputMode="tel"
                  />
                </Field>
                <Field label="Vehicle no. (optional)" htmlFor="pack-rider-vehicle">
                  <Input
                    id="pack-rider-vehicle"
                    value={rider.vehicle}
                    onChange={changeVehicle}
                    placeholder="KA-01-AB-1234"
                  />
                </Field>
              </Box>
              <Text variant="muted" className="mt-2.5 text-[12px]">
                Match the packet&apos;s <MonoText size="sm" className="font-bold">{sale.id}</MonoText> label to the order
                before handing it over.
              </Text>
              <Invoice sale={sale} profile={profile} className="print-area absolute top-0 -left-[99999px]" />
            </>
          ) : null}
          {step === "done" ? <DispatchedView sale={sale} /> : null}
        </Box>
        <Stack direction="row" align="center" justify="between" gap={2} className="border-t border-line px-5 py-3.5 print:hidden">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {step === "pack" ? (
            <Button variant="primary" disabled={!ready} onClick={seal}>
              {ready ? "Seal packet & generate invoice →" : `Scan all ${total} units to continue`}
            </Button>
          ) : null}
          {step === "handover" ? (
            <Button variant="primary" disabled={!rider.name.trim()} onClick={handOver}>
              <IconTruck size={15} /> Hand to delivery partner
            </Button>
          ) : null}
          {step === "done" && sale.status === "out" ? (
            <Button variant="gold" onClick={markDelivered}>
              Mark delivered
            </Button>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

function PackRail({ current }: { current: PackStep }) {
  function renderMark(item: (typeof PACK_RAIL)[number], index: number) {
    return <PackMark key={item.key} item={item} index={index} current={current} />;
  }
  return (
    <Stack direction="row" gap={2}>
      {PACK_RAIL.map(renderMark)}
    </Stack>
  );
}

function PackMark({
  item,
  index,
  current,
}: {
  item: (typeof PACK_RAIL)[number];
  index: number;
  current: PackStep;
}) {
  const tone = packRailTone(current, item.key);
  return (
    <Stack
      direction="row"
      align="center"
      gap={2}
      className={cn(
        "flex-1 rounded-[9px] border px-2.5 py-2 text-[12px] font-bold",
        tone === "on" && "border-mid bg-wash text-dark",
        tone === "done" && "border-line bg-wash-2 text-mid",
        tone === "idle" && "border-line bg-wash-2 text-muted",
      )}
    >
      <Text
        as="span"
        className={cn(
          "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[11px] font-extrabold text-white",
          tone === "on" && "bg-mid",
          tone === "done" && "bg-green",
          tone === "idle" && "bg-line",
        )}
      >
        {tone === "done" ? <IconCheck size={13} /> : index + 1}
      </Text>
      {item.label}
    </Stack>
  );
}

function PackLineRow({
  line,
  product,
  onPick,
}: {
  line: PackLine;
  product: InvProduct | undefined;
  onPick: (productId: string, delta: number) => void;
}) {
  const full = line.scanned >= line.qty;
  function less() {
    onPick(line.productId, -1);
  }
  function more() {
    onPick(line.productId, 1);
  }
  return (
    <Stack
      direction="row"
      align="center"
      gap={2}
      className={cn("border-b border-line px-3.5 py-2.5 last:border-b-0", full && "bg-wash-2")}
    >
      <Box className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-sm bg-wash text-[17px]">
        {product ? <Thumb p={product} /> : <IconPill size={15} />}
      </Box>
      <Box className="min-w-0 flex-1">
        <Text as="span" className="block truncate text-[13px] font-bold">
          {line.name}
        </Text>
        <Text variant="caption">
          {line.batchNo ? ` · batch ${line.batchNo}` : product ? ` · ${product.composition}` : ""}
        </Text>
      </Box>
      <Pill tone={full ? "green" : "gray"} className="min-w-[54px] justify-center">
        {line.scanned}/{line.qty}
      </Pill>
      <Stack direction="row" align="center" className="overflow-hidden rounded-sm border border-line-2">
        <Button
          variant="ghost"
          size="sm"
          aria-label="un-pick"
          disabled={line.scanned <= 0}
          onClick={less}
          className="h-7 w-[26px] rounded-none border-0 bg-wash-2 px-0 text-[15px] text-mid shadow-none"
        >
          −
        </Button>
        <Text as="span" className="min-w-[26px] text-center text-[13px] font-extrabold">
          {line.scanned}
        </Text>
        <Button
          variant="ghost"
          size="sm"
          aria-label="pick manually"
          disabled={full}
          onClick={more}
          className="h-7 w-[26px] rounded-none border-0 bg-wash-2 px-0 text-[15px] text-mid shadow-none"
        >
          +
        </Button>
      </Stack>
      {full ? (
        <Box className="shrink-0 text-green">
          <IconCheck size={16} />
        </Box>
      ) : null}
    </Stack>
  );
}

function DispatchedView({ sale }: { sale: Sale }) {
  const rider = sale.fulfillment?.rider;
  return (
    <>
      <Stack direction="row" align="center" gap={3} className="mb-3.5 rounded-md border border-line bg-wash-2 p-[18px] shadow-sm">
        <IconTruck size={24} />
        <Box className="flex-1">
          <Text as="span" className="text-[14px] font-bold">
            {sale.status === "delivered" ? "Delivered" : "Out for delivery"}
          </Text>
          <Text variant="muted" className="text-[12px]">
            Handed to {rider?.name ?? "delivery partner"}
            {rider?.phone ? ` · ${rider.phone}` : ""}
            {rider?.vehicle ? ` · ${rider.vehicle}` : ""}
            {sale.fulfillment?.handedAt ? ` · ${fmtDateTime(sale.fulfillment.handedAt)}` : ""}
          </Text>
        </Box>
      </Stack>
      <Box className="grid grid-cols-1 overflow-hidden rounded-md border border-line bg-line sm:grid-cols-3">
        <Fact label="Order" value={sale.id} mono />
        <Fact label="Customer" value={sale.customer.name} />
        <Fact label="Deliver to" value={sale.customer.address ?? "—"} />
      </Box>
      {sale.status === "out" ? (
        <Text variant="muted" className="mt-3 text-[12px]">
          When the rider confirms delivery, mark it below.
        </Text>
      ) : null}
      {sale.status === "delivered" ? (
        <Text variant="muted" className="mt-3 text-[12px]">
          <IconCheck size={13} /> This order has been delivered.
        </Text>
      ) : null}
    </>
  );
}

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <Box className="bg-paper px-[13px] py-[11px]">
      <Text variant="caption" className="text-[11px] font-semibold">
        {label}
      </Text>
      <Text className={cn("mt-0.5 text-[12.5px] font-bold text-dark", mono && "font-mono")}>{value}</Text>
    </Box>
  );
}
