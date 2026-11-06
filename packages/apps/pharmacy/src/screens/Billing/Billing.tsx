import { useEffect, useState, type ChangeEvent, type MouseEvent, type ReactNode } from "react";
import { showToast } from "@/store/actions/feedback.actions";
import {
  posAdd,
  posClear,
  posDec,
  posRemove,
  posSetBatch,
  posSetQty,
  setPosCustomer,
  setPosDiscount,
  setPosDiscountMode,
  setPosInsurer,
  setPosPatientId,
  setPosPay,
  setPosSource,
  setPosWard,
} from "@/store/slices/billing.slice";
import { setLastInvoice } from "@/store/slices/sales.slice";
import { selectIsHospital } from "@/store/selectors/auth.selector";
import {
  selectPosCount,
  selectPosDiscountFlat,
  selectPosTotals,
} from "@/store/selectors/billing.selector";
import { checkoutPos } from "@/store/thunks/billing.thunk";
import { useAppDispatch, useAppSelector, useConfirmedDispatch, usePharmacyNav } from "@/hooks";
import { CATEGORIES, findScan, inr, SALE_SOURCES, type InvProduct, type SaleSource } from "@/utils";
import { INSURERS } from "@/utils/calculations/hospital";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Select } from "@/components/atoms/Select";
import { Stack } from "@/components/atoms/Stack";
import { Text } from "@/components/atoms/Text";
import {
  IconArrowRight,
  IconCard,
  IconCash,
  IconCheck,
  IconHospital,
  IconPhone,
  IconPrint,
  IconReceipt,
  IconShare,
  IconShield,
  IconTruck,
  IconX,
} from "@/components/atoms/Icon";
import { Invoice } from "@/components/organisms";
import { ShareSheet } from "@/components/organisms";
import type { PosLine } from "@/store/slices/billing.slice";
import { cn } from "@/utils/className";
import {
  billingCheckoutGates,
  billingInvoiceTitle,
  billingLineView,
  billingSelectClass,
  billingSelectStyle,
  filterBillingProducts,
} from "./Billing.utils";
import type { BillingStep } from "./Billing.types";
import { ProductSearch } from "./components/ProductSearch";
import { CategoryFilter } from "./components/CategoryFilter";
import { ProductGrid } from "./components/ProductGrid";
import { CartPanel } from "./components/CartPanel";
import { CustomerBar } from "./components/CustomerBar";
import { SaleSourcePicker } from "./components/SaleSourcePicker";
import { BillSummary } from "./components/BillSummary";
import { PayModePicker, type PayOption } from "./components/PayModePicker";
import { OrderReview } from "./components/OrderReview";

const PAY_OPTS: PayOption[] = [
  { m: "cash", Ic: IconCash },
  { m: "upi", Ic: IconPhone },
  { m: "card", Ic: IconCard },
  { m: "cod", Ic: IconTruck },
  { m: "credit", Ic: IconReceipt },
  { m: "insurance", Ic: IconShield },
];

export default function Billing() {
  const dispatch = useAppDispatch();
  const confirm = useConfirmedDispatch();
  const { registerBack } = usePharmacyNav();
  const inventory = useAppSelector((state) => state.inventory.inventory);
  const pos = useAppSelector((state) => state.billing.pos);
  const posCustomer = useAppSelector((state) => state.billing.posCustomer);
  const posDiscount = useAppSelector((state) => state.billing.posDiscount);
  const posDiscountMode = useAppSelector((state) => state.billing.posDiscountMode);
  const posPay = useAppSelector((state) => state.billing.posPay);
  const posSource = useAppSelector((state) => state.billing.posSource);
  const posWard = useAppSelector((state) => state.billing.posWard);
  const posInsurer = useAppSelector((state) => state.billing.posInsurer);
  const posPatientId = useAppSelector((state) => state.billing.posPatientId);
  const lastInvoice = useAppSelector((state) => state.sales.lastInvoice);
  const profile = useAppSelector((state) => state.auth.profile);
  const wards = useAppSelector((state) => state.hospital.wards);
  const isHospital = useAppSelector(selectIsHospital);
  const posTotals = useAppSelector(selectPosTotals);
  const posCount = useAppSelector(selectPosCount);
  const posDiscountFlat = useAppSelector(selectPosDiscountFlat);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [share, setShare] = useState(false);
  const [scan, setScan] = useState("");
  const [step, setStep] = useState<BillingStep>("cart");

  function returnToCart() {
    setStep("cart");
    return true;
  }

  useEffect(
    function syncBack() {
      registerBack(step === "pay" ? returnToCart : null);
      return function clearBack() {
        registerBack(null);
      };
    },
    [step, registerBack],
  );

  function showCart() {
    setStep("cart");
  }
  function showPay() {
    setStep("pay");
  }
  function submitScan() {
    const code = scan.trim();
    if (!code) return;
    const hit = findScan(inventory, code);
    if (hit) {
      dispatch(posAdd({ id: hit.product.id, loose: false, batchNo: hit.batch?.batchNo }));
    }
    dispatch(
      showToast(
        hit
          ? `${hit.product.name}${hit.batch?.batchNo ? " · Batch " + hit.batch.batchNo : ""}`
          : `No match for “${code}”`,
      ),
    );
    setScan("");
  }
  function addPack(productId: string) {
    dispatch(posAdd({ id: productId }));
  }
  function addLoose(productId: string) {
    dispatch(posAdd({ id: productId, loose: true }));
  }
  function packQty(productId: string) {
    return (
      pos.find(function packed(line) {
        return line.productId === productId && !line.loose;
      })?.qty ?? 0
    );
  }
  function looseQty(productId: string) {
    return (
      pos.find(function loose(line) {
        return line.productId === productId && line.loose;
      })?.qty ?? 0
    );
  }
  function setCustomerName(name: string) {
    dispatch(setPosCustomer({ name }));
  }
  function setCustomerPhone(phone: string) {
    dispatch(setPosCustomer({ phone }));
  }
  function setCustomerDoctor(doctor: string) {
    dispatch(setPosCustomer({ doctor }));
  }
  async function doCheckout() {
    if (!okToBill) return;
    const result = await confirm(checkoutPos());
    if ("data" in result) setStep("cart");
  }
  async function doReception() {
    if (!rxOk || !wardOk || !insurerOk) return;
    const result = await confirm(checkoutPos({ paid: false }));
    if ("data" in result) setStep("cart");
  }
  function closeInvoice() {
    dispatch(setLastInvoice(null));
  }
  function openShare() {
    setShare(true);
  }
  function closeShare() {
    setShare(false);
  }
  function printInvoice() {
    window.print();
  }
  function keepModalOpen(event: MouseEvent<HTMLDivElement>) {
    event.stopPropagation();
  }
  function changeInsurer(event: ChangeEvent<HTMLSelectElement>) {
    dispatch(setPosInsurer(event.target.value));
  }
  function clearCart() {
    dispatch(posClear());
  }
  function decreaseLine(productId: string, loose?: boolean, batchNo?: string) {
    dispatch(posDec({ id: productId, loose, batchNo }));
  }
  function increaseLine(productId: string, loose?: boolean, batchNo?: string) {
    dispatch(posAdd({ id: productId, loose, batchNo }));
  }
  function setLineQuantity(productId: string, quantity: number, loose?: boolean, batchNo?: string) {
    dispatch(posSetQty({ id: productId, qty: quantity, loose, batchNo }));
  }
  function removeLine(productId: string, loose?: boolean, batchNo?: string) {
    dispatch(posRemove({ id: productId, loose, batchNo }));
  }
  function setLineBatch(productId: string, batchNo?: string, loose?: boolean) {
    dispatch(posSetBatch({ id: productId, batchNo, loose }));
  }
  function changeSource(source: SaleSource) {
    dispatch(setPosSource(source));
  }
  function changeWard(ward: string) {
    dispatch(setPosWard(ward));
  }
  function changePatientId(patientId: string) {
    dispatch(setPosPatientId(patientId));
  }
  function changeDiscount(value: number) {
    dispatch(setPosDiscount(value));
  }
  function changeDiscountMode(mode: "flat" | "percent") {
    dispatch(setPosDiscountMode(mode));
  }
  function changePay(mode: Parameters<typeof setPosPay>[0]) {
    dispatch(setPosPay(mode));
  }
  function changeSearch(value: string) {
    setSearchQuery(value);
  }
  function changeScan(value: string) {
    setScan(value);
  }
  function changeCategory(key: string) {
    setSelectedCategory(key);
  }

  const list = filterBillingProducts(inventory, selectedCategory, searchQuery);
  const hasRx = pos.some(function lineNeedsPrescription(line) {
    function sameProduct(product: InvProduct) {
      return product.id === line.productId;
    }
    return inventory.find(sameProduct)?.schedule !== "OTC";
  });
  const gates = billingCheckoutGates({
    hasPrescriptionItem: hasRx,
    doctor: posCustomer.doctor,
    payMode: posPay,
    customerName: posCustomer.name,
    insurer: posInsurer,
    isHospital,
    source: posSource,
    ward: posWard,
  });
  const rxOk = gates.prescriptionReady;
  const creditOk = gates.creditReady;
  const insurerOk = gates.insurerReady;
  const wardOk = gates.wardReady;
  const isCredit = posPay === "credit";
  const isInsurance = posPay === "insurance";
  const payOpts = PAY_OPTS.filter(function offered(option) {
    return isHospital || option.m !== "insurance";
  });
  const okToBill = gates.readyToBill;
  const detailsOk = gates.detailsReady;
  const sourceOptions = SALE_SOURCES.filter(function counterSources(source: { key: SaleSource }) {
    return source.key === "opd" || source.key === "counter" || source.key === posSource;
  });
  const sourceLabel =
    SALE_SOURCES.find(function named(source) {
      return source.key === posSource;
    })?.short ?? "Counter";
  const cartLines = pos.flatMap(function toCartLine(line: PosLine) {
    const view = billingLineView(line, inventory);
    return view ? [{ line, view }] : [];
  });

  if (step === "pay" && pos.length === 0) setStep("cart");

  function renderInsurer(insurer: string) {
    return { value: String(insurer), label: String(insurer) };
  }

  return (
    <>
      <Stack direction="row" align="center" className="mb-4 gap-2.5">
        <StepButton active={step === "cart"} onClick={showCart}>
          <StepMark tone={step === "pay" ? "done" : "on"}>
            {step === "pay" ? <IconCheck size={12} /> : 1}
          </StepMark>{" "}
          Cart &amp; customer
        </StepButton>
        <Box className="inline-flex text-faint">
          <IconArrowRight size={15} />
        </Box>
        <StepButton
          active={step === "pay"}
          disabled={pos.length === 0 || !detailsOk}
          onClick={showPay}
        >
          <StepMark tone={step === "pay" ? "on" : "idle"}>2</StepMark> Payment
        </StepButton>
      </Stack>

      {step === "cart" ? (
        <Box className="grid grid-cols-1 items-start gap-[18px] min-[1181px]:grid-cols-[1fr_408px]">
          <Box>
            <ProductSearch
              scan={scan}
              searchQuery={searchQuery}
              onScanChange={changeScan}
              onScanSubmit={submitScan}
              onSearchChange={changeSearch}
            />
            <CategoryFilter
              categories={CATEGORIES}
              selectedCategory={selectedCategory}
              onSelect={changeCategory}
            />
            <ProductGrid
              products={list}
              searchQuery={searchQuery}
              packQty={packQty}
              looseQty={looseQty}
              onAddPack={addPack}
              onAddLoose={addLoose}
            />
          </Box>
          <CartPanel
            count={posCount}
            itemCount={pos.length}
            payable={posTotals.payable}
            canProceed={detailsOk}
            prescriptionReady={rxOk}
            onClear={clearCart}
            onProceed={showPay}
            lines={cartLines}
            onDecrease={decreaseLine}
            onIncrease={increaseLine}
            onQuantity={setLineQuantity}
            onRemove={removeLine}
            onBatch={setLineBatch}
            customer={
              <CustomerBar
                customer={posCustomer}
                hasPrescriptionItem={hasRx}
                prescriptionReady={rxOk}
                onName={setCustomerName}
                onPhone={setCustomerPhone}
                onDoctor={setCustomerDoctor}
              />
            }
            source={
              isHospital ? (
                <SaleSourcePicker
                  sources={sourceOptions}
                  source={posSource}
                  ward={posWard}
                  wards={wards}
                  patientId={posPatientId}
                  onSource={changeSource}
                  onWard={changeWard}
                  onPatientId={changePatientId}
                />
              ) : null
            }
          />
        </Box>
      ) : (
        <Box>
          <Button variant="ghost" size="sm" className="mb-3.5" onClick={showCart}>
            ← Back to add items
          </Button>
          <Box className="grid grid-cols-1 items-start gap-[18px] min-[901px]:grid-cols-[1fr_400px]">
            <OrderReview
              count={posCount}
              customer={posCustomer}
              hasPrescriptionItem={hasRx}
              isHospital={isHospital}
              sourceLabel={sourceLabel}
              source={posSource}
              ward={posWard}
              patientId={posPatientId}
              lines={pos}
              inventory={inventory}
              onEdit={showCart}
            />
            <Stack className="overflow-hidden rounded-lg border border-line bg-paper shadow-card">
              <Box className="border-b border-line px-4 py-[15px]">
                <Heading level={3} className="text-[15px]">
                  Bill &amp; payment
                </Heading>
              </Box>
              <BillSummary
                gross={posTotals.gross}
                taxable={posTotals.taxable}
                totalTax={posTotals.totalTax}
                payable={posTotals.payable}
                discount={posDiscount}
                discountMode={posDiscountMode}
                discountAmount={posDiscountFlat}
                onDiscount={changeDiscount}
                onDiscountMode={changeDiscountMode}
              />
              <Box className="px-4 pt-3 pb-4">
                <Text
                  as="span"
                  className="mb-[7px] flex text-[10px] font-extrabold tracking-[0.07em] text-faint uppercase"
                >
                  Payment method
                </Text>
                <PayModePicker options={payOpts} selected={posPay} onSelect={changePay} />
                {isInsurance ? (
                  <Select
                    className={cn("mb-2.5", billingSelectClass)}
                    style={billingSelectStyle}
                    value={posInsurer}
                    onChange={changeInsurer}
                    options={[
                      { value: "", label: "Select insurer / TPA\u2026" },
                      ...INSURERS.map(renderInsurer),
                    ]}
                  />
                ) : null}
                {isCredit ? (
                  <Box className="mb-2.5 flex w-full justify-center rounded-[20px] bg-amber-bg px-[7px] py-[7px] text-center text-[12.5px] font-bold whitespace-nowrap text-gold-d">
                    {creditOk
                      ? `On ${posCustomer.name.trim()}'s credit account (khata) — settled later`
                      : "Enter a customer name to give credit"}
                  </Box>
                ) : null}
                {isCredit ? (
                  <Button
                    variant="primary"
                    size="lg"
                    block
                    disabled={pos.length === 0 || !creditOk}
                    onClick={doCheckout}
                  >
                    <IconReceipt size={17} /> Record {inr(posTotals.payable)} on credit
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      block
                      disabled={pos.length === 0 || !okToBill}
                      onClick={doCheckout}
                    >
                      <IconPrint size={17} />{" "}
                      {isInsurance
                        ? `Bill ${inr(posTotals.payable)} to insurer`
                        : `Charge ${inr(posTotals.payable)} & invoice`}
                    </Button>
                    <Button
                      variant="ghost"
                      block
                      className="mt-2"
                      disabled={pos.length === 0 || !rxOk || !wardOk || !insurerOk}
                      onClick={doReception}
                    >
                      <IconHospital size={15} /> Send to reception · pay later
                    </Button>
                  </>
                )}
              </Box>
            </Stack>
          </Box>
        </Box>
      )}

      {lastInvoice ? (
        <>
          <style>
            {
              "@keyframes billing-fade{from{opacity:0}}@keyframes billing-pop{from{transform:translateY(14px) scale(.98);opacity:.6}}"
            }
          </style>
          <Box
            className="fixed inset-0 z-[100] flex animate-[billing-fade_0.16s_ease] items-center justify-center bg-[#0d201580] p-6 backdrop-blur-[3px] max-[767px]:items-end max-[767px]:p-0"
            onClick={closeInvoice}
          >
            <Box
              role="dialog"
              aria-modal="true"
              aria-label={billingInvoiceTitle(lastInvoice)}
              className="flex max-h-[90vh] w-full max-w-[720px] animate-[billing-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] flex-col overflow-hidden rounded-lg bg-paper shadow-pop max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-lg max-[767px]:rounded-b-none"
              onClick={keepModalOpen}
            >
              <Stack
                direction="row"
                align="center"
                justify="between"
                className="border-b border-line px-5 py-4 print:hidden"
              >
                <Heading level={3} className="text-[17px]">
                  {billingInvoiceTitle(lastInvoice)}
                </Heading>
                <IconButton
                  label="Close"
                  className="rounded-sm border-0 bg-wash-2 text-ink-2 hover:bg-wash"
                  onClick={closeInvoice}
                >
                  <IconX size={18} />
                </IconButton>
              </Stack>
              <Box className="overflow-y-auto px-5 py-5">
                <Invoice sale={lastInvoice} profile={profile} className="print-area" />
              </Box>
              <Stack
                direction="row"
                justify="end"
                className="gap-2.5 border-t border-line px-5 py-3.5 max-[767px]:flex-wrap print:hidden"
              >
                <Button variant="ghost" className="max-[767px]:flex-1" onClick={closeInvoice}>
                  Done
                </Button>
                <Button variant="ghost" className="max-[767px]:flex-1" onClick={openShare}>
                  <IconShare size={16} /> Share bill
                </Button>
                <Button variant="primary" className="max-[767px]:flex-1" onClick={printInvoice}>
                  <IconPrint size={16} /> Print / Save PDF
                </Button>
              </Stack>
            </Box>
          </Box>
        </>
      ) : null}

      {share && lastInvoice ? (
        <ShareSheet sale={lastInvoice} profile={profile} onClose={closeShare} />
      ) : null}
    </>
  );
}

function StepButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "h-auto gap-2 rounded-full border-line bg-paper py-[7px] pr-[15px] pl-2 text-[13px] font-bold text-muted hover:border-line hover:bg-paper hover:text-muted",
        "disabled:pointer-events-auto disabled:cursor-not-allowed disabled:border-line disabled:bg-paper disabled:text-muted disabled:opacity-50 disabled:shadow-none",
        active && "border-mid bg-wash text-dark hover:border-mid hover:bg-wash hover:text-dark",
      )}
    >
      {children}
    </Button>
  );
}

function StepMark({ tone, children }: { tone: "on" | "done" | "idle"; children: ReactNode }) {
  return (
    <Text
      as="span"
      className={cn(
        "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full text-[12px] leading-none font-extrabold",
        tone === "on" && "bg-mid text-white",
        tone === "done" && "bg-green text-white",
        tone === "idle" && "bg-wash text-muted",
      )}
    >
      {children}
    </Text>
  );
}
