import { useEffect, useState } from "react";
import { setFormFault, setInvFilter, showToast } from "@/store/actions/feedback.actions";
import {
  importMedicines,
  toggleLoose,
  toggleOnline,
  updateProduct,
} from "@/store/thunks/inventory.thunk";
import { faultOf } from "@/utils/validation";
import { useAppDispatch, useAppSelector, useConfirmedDispatch, usePharmacyNav } from "@/hooks";
import { Box } from "@/components/atoms/Box";
import type { InvProduct, PharmacyProfile } from "@/utils";
import { exportStockCsv, exportStockPdf } from "@/utils/calculations/stockExport";
import { parseMedicineCsv } from "@/utils/purchases";
import { downloadMedicineTemplate } from "@/utils/purchases";
import {
  INVENTORY_FILTER_LABEL,
  filterInventoryProducts,
  inventorySnapshot,
  isInventoryFilter,
  type InventoryFilter,
} from "./Inventory.utils";
import { InventoryStats } from "./components/InventoryStats";
import { InventoryToolbar } from "./components/InventoryToolbar";
import { InventoryTable } from "./components/InventoryTable";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { ProductModal } from "./components/ProductModal";

export default function InventoryScreen() {
  const dispatch = useAppDispatch();
  const confirm = useConfirmedDispatch();
  const { go } = usePharmacyNav();
  const inventory = useAppSelector((state) => state.inventory.inventory);
  const sales = useAppSelector((state) => state.sales.sales);
  const profile = useAppSelector((state) => state.auth.profile);
  const now = useAppSelector((state) => state.ui.now);
  const invFilter = useAppSelector((state) => state.ui.invFilter);
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [edit, setEdit] = useState<InvProduct | null>(null);
  const [detail, setDetail] = useState<InvProduct | null>(null);

  useEffect(
    function applyRequestedFilter() {
      if (invFilter && isInventoryFilter(invFilter)) {
        setFilter(invFilter);
        dispatch(setInvFilter(null));
      }
    },
    [dispatch, invFilter],
  );

  const list = filterInventoryProducts(inventory, filter, searchQuery, now);
  const snapshot = inventorySnapshot(inventory, sales, now);
  const detailProduct = detail
    ? (inventory.find(function same(product) {
        return product.id === detail.id;
      }) ?? detail)
    : null;

  function changeSearch(value: string) {
    setSearchQuery(value);
  }
  function openDetail(product: InvProduct) {
    setDetail(product);
  }
  function openEdit(product: InvProduct) {
    setEdit(product);
  }
  function closeEdit() {
    setEdit(null);
  }
  function closeDetail() {
    setDetail(null);
  }
  function editFromDetail() {
    setEdit(detail);
    setDetail(null);
  }
  async function saveProduct(product: InvProduct) {
    const result = await confirm(updateProduct({ id: product.id, patch: product }), {
      kind: "edit",
    });
    if ("data" in result) setEdit(null);
  }
  function exportExcel() {
    exportStockCsv(list, INVENTORY_FILTER_LABEL[filter], now);
  }
  function exportPdf() {
    exportStockPdf(list, profile as PharmacyProfile, INVENTORY_FILTER_LABEL[filter], now);
  }
  function importFile(file: File) {
    const reader = new FileReader();
    reader.onload = function loaded() {
      void finishImport(String(reader.result));
    };
    reader.readAsText(file);
  }
  async function finishImport(text: string) {
    const parsed = parseMedicineCsv(text);
    if (!parsed.products.length) {
      dispatch(setFormFault(faultOf(new Error(parsed.errors[0] || "No medicines in that sheet"))));
      return;
    }
    const result = await confirm(importMedicines(parsed.products));
    if ("data" in result && result.data.skipped.length) {
      dispatch(showToast(`${result.data.skipped.length} already in the catalogue`));
    }
  }
  function downloadSample() {
    downloadMedicineTemplate();
  }
  function openPurchases() {
    go("purchases");
  }
  function openRackMap() {
    go("rackmap");
  }

  return (
    <Box className="mx-auto max-w-[1680px]">
      <InventoryStats snapshot={snapshot} onFilter={setFilter} />
      <InventoryToolbar
        filter={filter}
        alertCount={snapshot.alertCount}
        unallocatedCount={snapshot.unallocatedCount}
        searchQuery={searchQuery}
        canExport={list.length > 0}
        onFilter={setFilter}
        onSearch={changeSearch}
        onExcel={exportExcel}
        onPdf={exportPdf}
        onRackMap={openRackMap}
        onSample={downloadSample}
        onImportFile={importFile}
        onAddStock={openPurchases}
      />
      <InventoryTable
        products={list}
        catalogueEmpty={inventory.length === 0}
        now={now}
        onOpen={openDetail}
        onEdit={openEdit}
        onToggleLoose={(id) => void confirm(toggleLoose(id))}
        onToggleOnline={(id) => void confirm(toggleOnline(id))}
        onGo={go}
      />
      {edit ? <ProductModal product={edit} onClose={closeEdit} onSave={saveProduct} /> : null}
      {detailProduct ? (
        <ProductDetailModal
          product={detailProduct}
          sales={sales}
          now={now}
          onClose={closeDetail}
          onEdit={editFromDetail}
          toggleOnline={(id) => void confirm(toggleOnline(id))}
          toggleLoose={(id) => void confirm(toggleLoose(id))}
          go={go}
        />
      ) : null}
    </Box>
  );
}
