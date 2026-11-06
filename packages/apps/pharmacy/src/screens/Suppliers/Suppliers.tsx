import { Box, Button } from "@/components/atoms";
import { Directory } from "@/screens/Suppliers/components/Directory";
import { SupplyList } from "@/screens/Suppliers/components/SupplyList";
import { PriceCompare } from "@/screens/Suppliers/components/PriceCompare";
import { useState } from "react";
import { useAppSelector } from "@/hooks";
import { preferredSupplyCount } from "./Suppliers.utils";
type Tab = "directory" | "supply" | "compare";
function segClass(selected: boolean) {
  return selected
    ? "!rounded-[6px] !border-0 !bg-paper !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-dark !shadow-sm hover:!bg-paper"
    : "!rounded-[6px] !border-0 !bg-transparent !px-[13px] !py-1.5 !text-[12.5px] !font-bold !text-muted !shadow-none hover:!bg-transparent hover:!text-muted";
}
export default function DistributorsScreen() {
  const [tab, setTab] = useState<Tab>("directory");
  const suppliers = useAppSelector((state) => state.purchases.suppliers);
  const supplyList = useAppSelector((state) => state.purchases.supplyList);
  const preferred = preferredSupplyCount(supplyList);
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className="!mb-4 !inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
        <Button
          variant="ghost"
          size="sm"
          className={segClass(tab === "directory")}
          onClick={setTabOnClick}
        >
          Distributors ({suppliers.length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={segClass(tab === "supply")}
          data-preferred={preferred}
          onClick={setTabOnClick2}
        >
          Supply list ({supplyList.length})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={segClass(tab === "compare")}
          onClick={setTabOnClick3}
        >
          Price compare
        </Button>
      </Box>
      {tab === "directory" && <Directory />}
      {tab === "supply" && <SupplyList />}
      {tab === "compare" && <PriceCompare />}
    </Box>
  );
  function setTabOnClick() {
    return setTab("directory");
  }
  function setTabOnClick2() {
    return setTab("supply");
  }
  function setTabOnClick3() {
    return setTab("compare");
  }
}
