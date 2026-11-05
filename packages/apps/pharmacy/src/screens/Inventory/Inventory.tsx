import { useEffect, useState } from "react";
import { usePharma } from "@/hooks";
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
  const {
    inventory,
    sales,
    profile,
    now,
    toggleOnline,
    toggleLoose,
    updateProduct,
    go,
    invFilter,
    setInvFilter,
    importMedicines,
    showFault,
    toast,
  } = usePharma();
  const [filter, setFilter] = useState<InventoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [edit, setEdit] = useState<InvProduct | null>(null);
  const [detail, setDetail] = useState<InvProduct | null>(null);

  useEffect(
    function applyRequestedFilter() {
      if (invFilter && isInventoryFilter(invFilter)) {
        setFilter(invFilter);
        setInvFilter(null);
      }
    },
    [invFilter, setInvFilter],
  );

  const list = filterInventoryProducts(inventory, filter, searchQuery, now);
  const snapshot = inventorySnapshot(inventory, sales, now);
  const detailProduct = detail ? (inventory.find(function same(product) {
    return product.id === detail.id;
  }) ?? detail) : null;

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
    const err = await updateProduct(product.id, product);
    if (!err) setEdit(null);
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
      showFault(parsed.errors[0] || "No medicines in that sheet");
      return;
    }
    const result = await importMedicines(parsed.products);
    if (result?.skipped.length) toast(`${result.skipped.length} already in the catalogue`);
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
        onToggleLoose={toggleLoose}
        onToggleOnline={toggleOnline}
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
          toggleOnline={toggleOnline}
          toggleLoose={toggleLoose}
          go={go}
        />
      ) : null}
    </Box>
  );
}
