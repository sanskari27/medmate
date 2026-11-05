import { Directory } from "@/screens/Suppliers/components/Directory";
import { SupplyList } from "@/screens/Suppliers/components/SupplyList";
import { PriceCompare } from "@/screens/Suppliers/components/PriceCompare";
import { useState } from "react";
import { usePharma } from "@/hooks";

type Tab = "directory" | "supply" | "compare";

export default function DistributorsScreen() {
  const [tab, setTab] = useState<Tab>("directory");
  const { suppliers, supplyList } = usePharma();
  return (
    <div className="pd-canvas-wide">
      <div className="pd-seg" style={{ marginBottom: 18 }}>
        <button className={tab === "directory" ? "on" : ""} onClick={() => setTab("directory")}>
          Distributors ({suppliers.length})
        </button>
        <button className={tab === "supply" ? "on" : ""} onClick={() => setTab("supply")}>
          Supply list ({supplyList.length})
        </button>
        <button className={tab === "compare" ? "on" : ""} onClick={() => setTab("compare")}>
          Price compare
        </button>
      </div>
      {tab === "directory" && <Directory />}
      {tab === "supply" && <SupplyList />}
      {tab === "compare" && <PriceCompare />}
    </div>
  );
}

/* ─────────────── Tab 1 · Distributor directory ─────────────── */

/* ─────────────── Tab 2 · Supply list ─────────────── */

/* ─────────────── Tab 3 · Price comparison ─────────────── */

/* ─────────────── Modals ─────────────── */
