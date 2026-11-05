import { Directory } from "./Directory";
import { SupplyList } from "./SupplyList";
import { PriceCompare } from "./PriceCompare";
import { useState } from "react";
import { usePharma } from "@/app/session/pharmacy-provider";

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
