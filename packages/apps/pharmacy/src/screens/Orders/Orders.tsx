import { matchRx } from "@/screens/Orders/utils/matchRx";
import { OrderDetail } from "@/screens/Orders/components/OrderDetail";

export { matchRx, OrderDetail };

import { useState } from "react";
import { useAppSelector, useConfirmedDispatch, usePharmacyNav } from "@/hooks";
import { advanceOrder, cancelOrder, markPaid } from "@/store/thunks/sales.thunk";
import { Box } from "@/components/atoms/Box";
import { ShareSheet } from "@/components/organisms";
import type { PayMode, Prescription, Sale } from "@/utils";
import type { OrderFilter, OrderTab } from "./Orders.types";
import { filterOrders, orderCounts } from "./Orders.utils";
import { OrderFilters } from "./components/OrderFilters";
import { OrderTable } from "./components/OrderTable";
import PackOrder from "./components/PackOrder";

export default function OrdersScreen() {
  const confirm = useConfirmedDispatch();
  const { go } = usePharmacyNav();
  const sales = useAppSelector((state) => state.sales.sales);
  const prescriptions = useAppSelector((state) => state.prescriptions.prescriptions);
  const profile = useAppSelector((state) => state.auth.profile);
  const now = useAppSelector((state) => state.ui.now);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<Sale | null>(null);
  const [viewTab, setViewTab] = useState<OrderTab>("history");
  const [shareSale, setShareSale] = useState<Sale | null>(null);
  const [packId, setPackId] = useState<string | null>(null);

  const list = filterOrders(sales, filter, searchQuery);
  const counts = orderCounts(sales);
  const current = view
    ? (sales.find(function same(sale) {
        return sale.id === view.id;
      }) ?? view)
    : null;

  function openOrder(sale: Sale, tab: OrderTab) {
    setViewTab(tab);
    setView(sale);
  }
  function closeView() {
    setView(null);
  }
  function closeShare() {
    setShareSale(null);
  }
  function closePack() {
    setPackId(null);
  }
  function shareCurrent() {
    if (view) setShareSale(view);
  }
  function advanceSale(id: string) {
    void confirm(advanceOrder(id));
  }
  function cancelSale(id: string) {
    void confirm(cancelOrder(id));
  }
  function markOrderPaid(id: string, payMode: PayMode) {
    void confirm(markPaid({ id, payMode }));
  }
  function advanceCurrent() {
    if (view) advanceSale(view.id);
  }
  function cancelCurrent() {
    if (view) cancelSale(view.id);
  }
  function markCurrent(mode: PayMode) {
    if (view) markOrderPaid(view.id, mode);
  }
  function openPrescriptions() {
    setView(null);
    go("prescriptions");
  }
  function packCurrent() {
    if (!view) return;
    setView(null);
    setPackId(view.id);
  }

  function linked(rx: Prescription) {
    return rx.id === current?.rxId;
  }
  function sameSale(sale: Sale) {
    return sale.id === shareSale?.id;
  }
  return (
    <Box className="mx-auto max-w-[1680px]">
      <OrderFilters
        filter={filter}
        counts={counts}
        searchQuery={searchQuery}
        onFilter={setFilter}
        onSearch={setSearchQuery}
      />
      <OrderTable
        sales={list}
        now={now}
        onOpen={openOrder}
        onMarkPaid={markOrderPaid}
        onAdvance={advanceSale}
        onCancel={cancelSale}
        onPack={setPackId}
        onShare={setShareSale}
      />
      {current ? (
        <OrderDetail
          key={current.id + viewTab}
          initialTab={viewTab}
          sale={current}
          rx={prescriptions.find(linked) ?? matchRx(prescriptions, current)}
          profile={profile}
          onClose={closeView}
          onAdvance={advanceCurrent}
          onCancel={cancelCurrent}
          onMarkPaid={markCurrent}
          onShare={shareCurrent}
          onOpenRx={openPrescriptions}
          onPack={packCurrent}
          now={now}
        />
      ) : null}
      {packId ? <PackOrder saleId={packId} onClose={closePack} /> : null}
      {shareSale ? (
        <ShareSheet
          sale={sales.find(sameSale) ?? shareSale}
          profile={profile}
          onClose={closeShare}
        />
      ) : null}
    </Box>
  );
}
