import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { problemMessage, useAuthState } from "@/features/authentication";
import { inventoryApi, type InventoryProduct } from "@/features/inventory";
import { useDebounced } from "@/hooks/useDebounced";
import { invoiceSettingsApi } from "@/features/invoice-settings";
import { offersApi } from "@/features/offers";
import { Box } from "@/components/ui/Box";
import {
  billFailed,
  billPosted,
  discountSet,
  linesReplaced,
  patientSet,
  prescriptionSet,
  saleCleared,
  type BillingState,
} from "../../billing.slice";
import { useCreateBillMutation } from "../../billing.api";
import {
  addProduct,
  canCharge,
  chargeReady,
  chooseBatch,
  cleanDiscount,
  round2,
  setLineDiscount,
  setQuantity,
  type CartLine,
} from "../../model";
import { billTotals } from "./billingView";
import { BillingCart } from "./components/BillingCart";
import { BillingSearch } from "./components/BillingSearch";
import { BillingSettlement } from "./components/BillingSettlement";
import { PostedInvoice } from "./components/PostedInvoice";

export function BillingPage() {
  const dispatch = useDispatch();
  const { session } = useAuthState();
  const cart = useSelector((state: { billing: BillingState }) => state.billing);
  const [query, setQuery] = useState("");
  const needle = useDebounced(query.trim());
  const inventory = inventoryApi.useListInventoryQuery(
    { page: 1, size: 8, q: needle },
    { skip: needle.length === 0 },
  );
  const offers = offersApi.useListOffersQuery(undefined, { refetchOnMountOrArgChange: true });
  const settings = invoiceSettingsApi.useReadInvoiceSettingsQuery();
  const [createBill, chargeState] = useCreateBillMutation();
  const [highlight, setHighlight] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [qtyDraft, setQtyDraft] = useState<Record<string, string>>({});
  const [focusTick, setFocusTick] = useState(0);
  const scanRef = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<{ key: string; col: string } | null>(null);
  const linesRef = useRef(cart.lines);
  linesRef.current = cart.lines;
  const seen = useRef(new Map<string, InventoryProduct>());
  for (const item of inventory.data?.products ?? []) seen.current.set(item.productId, item);
  const products = [...seen.current.values()];
  const results = needle.length === 0 ? [] : (inventory.data?.products ?? []);
  const activeOffers = offers.data?.offers ?? [];
  const chargeAllowed = canCharge(session?.account.pharmacyRole, session?.account.permissions);
  const needsRx = cart.lines.some((line) => {
    const product = products.find((item) => item.productId === line.productId);
    return product?.prescriptionRequired === true;
  });
  const ready =
    chargeAllowed &&
    !cart.posted &&
    chargeReady({
      lines: cart.lines,
      products,
      patientName: cart.patientName,
      patientPhone: cart.patientPhone,
      prescribedBy: cart.prescribedBy,
      prescriptionNumber: cart.prescriptionNumber,
    });

  const totals = billTotals(cart.lines, products, activeOffers, {
    type: cart.discountType,
    value: cart.discountValue,
  });
  const received = Number(cashReceived);
  const change =
    Number.isFinite(received) && received > totals.payable ? round2(received - totals.payable) : 0;

  function focusScan() {
    scanRef.current?.focus();
    scanRef.current?.select();
  }

  function clearQtyDraft(key: string) {
    setQtyDraft((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function writeQty(line: CartLine, raw: string, max: number) {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setQtyDraft((current) => ({ ...current, [line.key]: "" }));
      return;
    }
    const next = setQuantity(cart.lines, line.key, Number(digits), max);
    const stored = next.find((item) => item.key === line.key)?.qty;
    setQtyDraft((current) => ({
      ...current,
      [line.key]: stored == null ? digits : String(stored),
    }));
    dispatch(linesReplaced(next));
  }

  function focusCell(key: string, col: string) {
    focusTarget.current = { key, col };
    setFocusTick((tick) => tick + 1);
  }

  useEffect(() => {
    if (cart.posted) return;
    focusTarget.current = null;
    scanRef.current?.focus();
  }, [cart.posted]);

  useEffect(() => {
    const target = focusTarget.current;
    if (!target) return;
    const el = document.querySelector<HTMLElement>(
      `[data-line-key="${target.key}"][data-col="${target.col}"]`,
    );
    el?.focus();
    if (el instanceof HTMLInputElement && document.activeElement === el) el.select();
  }, [focusTick]);

  const chargeRef = useRef(charge);
  chargeRef.current = charge;
  const removeRef = useRef(removeLine);
  removeRef.current = removeLine;
  const focusCellRef = useRef(focusCell);
  focusCellRef.current = focusCell;

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (cartPosted()) return;
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void chargeRef.current();
        return;
      }
      if (event.altKey && event.key === "Backspace") {
        const key = document.activeElement?.closest("tr")?.getAttribute("data-line-key");
        if (!key) return;
        event.preventDefault();
        removeRef.current(key);
        return;
      }
      const typing = isTypingTarget(document.activeElement);
      if (event.key === "/" && !typing) {
        event.preventDefault();
        scanRef.current?.focus();
        scanRef.current?.select();
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setQuery("");
        scanRef.current?.focus();
        scanRef.current?.select();
        return;
      }
      if (event.key === "F2") {
        event.preventDefault();
        const key =
          document.activeElement?.closest("tr")?.getAttribute("data-line-key") ??
          linesRef.current.at(-1)?.key;
        if (key) focusCellRef.current(key, "special");
        return;
      }
      if (event.key === "F3") {
        event.preventDefault();
        scanRef.current?.focus();
        scanRef.current?.select();
        return;
      }
      if (event.key === "F4") {
        event.preventDefault();
        document.getElementById("patient-phone")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function add(product: InventoryProduct) {
    const next = addProduct(cart.lines, product);
    setNotice(next.error);
    if (next.lines !== cart.lines) {
      dispatch(linesReplaced(next.lines));
      const touched = next.lines.find((line) => {
        const prev = cart.lines.find((item) => item.key === line.key);
        return !prev || prev.qty !== line.qty;
      });
      if (touched) focusCell(touched.key, "qty");
    }
    setQuery("");
    setHighlight(0);
  }

  function removeLine(key: string) {
    const lines = linesRef.current;
    const index = lines.findIndex((line) => line.key === key);
    const next = lines.filter((line) => line.key !== key);
    dispatch(linesReplaced(next));
    const focus = next[Math.min(index, next.length - 1)];
    if (focus) focusCell(focus.key, "qty");
    else scanRef.current?.focus();
  }

  function onScanKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (results.length === 0) {
        const first = cart.lines[0];
        if (first) focusCell(first.key, "qty");
        return;
      }
      setHighlight((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => Math.max(index - 1, 0));
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setQuery("");
      return;
    }
    if (event.key !== "Enter" || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const exact = results.find(
      (product) => product.productId.toLowerCase() === query.trim().toLowerCase(),
    );
    const picked = exact ?? results[highlight];
    if (picked) add(picked);
  }

  function onQtyKey(event: KeyboardEvent<HTMLInputElement>, line: CartLine, max: number) {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      focusScan();
      return;
    }
    if (event.key === "Enter" && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      focusNext(event.currentTarget);
      return;
    }
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      clearQtyDraft(line.key);
      dispatch(linesReplaced(setQuantity(cart.lines, line.key, line.qty + 1, max)));
      return;
    }
    if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      clearQtyDraft(line.key);
      dispatch(linesReplaced(setQuantity(cart.lines, line.key, line.qty - 1, max)));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      const index = cart.lines.findIndex((item) => item.key === line.key);
      const previous = cart.lines[index - 1];
      if (previous) focusCell(previous.key, "qty");
      else focusScan();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      const index = cart.lines.findIndex((item) => item.key === line.key);
      const next = cart.lines[index + 1];
      if (next) focusCell(next.key, "qty");
      else document.getElementById("patient-phone")?.focus();
    }
  }

  async function charge() {
    if (!ready) return;
    try {
      const response = await createBill({
        patientName: cart.patientName.trim(),
        patientPhone: cart.patientPhone,
        prescribedBy: needsRx ? cart.prescribedBy.trim() : "",
        prescriptionNumber: needsRx ? cart.prescriptionNumber.trim() : "",
        payMode: "cash",
        discount: { type: cart.discountType, value: cart.discountValue },
        lines: cart.lines.map((line) => ({
          productId: line.productId,
          batchNo: line.batchNo ?? "",
          qty: line.qty,
          discount: { type: line.discountType, value: line.discountValue },
        })),
      }).unwrap();
      dispatch(billPosted(response.bill));
      setCashReceived("");
    } catch (error) {
      dispatch(billFailed(problemMessage(error, "The bill could not be saved")));
    }
  }

  const tendered = cashReceived.trim() === "" ? 0 : received;
  const balance = tendered <= 0 ? totals.payable : Math.max(0, round2(totals.payable - tendered));

  return (
    <Box className="flex h-auto min-h-[32rem] flex-col gap-2 min-[1100px]:h-[calc(100dvh-122px)] min-[1100px]:min-h-0">
      <BillingSearch
        query={query}
        highlight={highlight}
        results={results}
        scanRef={scanRef}
        onQuery={(value) => {
          setQuery(value);
          setHighlight(0);
        }}
        onKeyDown={onScanKey}
        onClear={() => {
          setQuery("");
          focusScan();
        }}
        onPick={add}
      />
      <BillingCart
        lines={cart.lines}
        products={products}
        offers={activeOffers}
        qtyDraft={qtyDraft}
        units={totals.units}
        loading={inventory.isLoading}
        notice={notice}
        onChooseBatch={(line, batchNo) => {
          const product = products.find((item) => item.productId === line.productId);
          if (!product) return;
          dispatch(linesReplaced(chooseBatch(cart.lines, line.key, batchNo, product)));
        }}
        onQtyChange={writeQty}
        onQtyBlur={clearQtyDraft}
        onQtyKey={onQtyKey}
        onDiscountType={(line, type) => {
          dispatch(linesReplaced(setLineDiscount(cart.lines, line.key, type, line.discountValue)));
          if (type !== "none") focusCell(line.key, "special-value");
        }}
        onDiscountValue={(line, value) => {
          dispatch(linesReplaced(setLineDiscount(cart.lines, line.key, line.discountType, value)));
        }}
        onRemove={removeLine}
      />
      <BillingSettlement
        patientName={cart.patientName}
        patientPhone={cart.patientPhone}
        prescribedBy={cart.prescribedBy}
        prescriptionNumber={cart.prescriptionNumber}
        needsRx={needsRx}
        discountType={cart.discountType}
        discountValue={cart.discountValue}
        cashReceived={cashReceived}
        totals={totals}
        change={change}
        balance={balance}
        chargeAllowed={chargeAllowed}
        ready={ready}
        charging={chargeState.isLoading}
        error={cart.error}
        onPatient={(name, phone) => dispatch(patientSet({ name, phone }))}
        onPrescription={(doctor, number) => dispatch(prescriptionSet({ doctor, number }))}
        onDiscountType={(type) => dispatch(discountSet(cleanDiscount(type, cart.discountValue)))}
        onDiscountValue={(value) => dispatch(discountSet(cleanDiscount(cart.discountType, value)))}
        onCash={setCashReceived}
        onCharge={() => void charge()}
      />
      {cart.posted ? (
        <PostedInvoice
          posted={cart.posted}
          settings={settings.data}
          onNew={() => dispatch(saleCleared())}
        />
      ) : null}
    </Box>
  );
}

function cartPosted() {
  return document.querySelector("[data-posted-bill]") !== null;
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement
  );
}

function focusNext(current: HTMLElement) {
  const nodes = [...document.querySelectorAll<HTMLElement>("input, select, button")].filter(
    (el) => !el.matches(":disabled") && el.tabIndex >= 0,
  );
  const next = nodes[nodes.indexOf(current) + 1];
  next?.focus();
  if (next instanceof HTMLInputElement) next.select();
}
