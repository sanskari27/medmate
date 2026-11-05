import { Box, Button } from "@/components/atoms";
import { cn } from "@/utils/className";
import { Directory } from "@/screens/Suppliers/components/Directory";
import { SupplyList } from "@/screens/Suppliers/components/SupplyList";
import { PriceCompare } from "@/screens/Suppliers/components/PriceCompare";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { preferredSupplyCount } from "./Suppliers.utils";
type Tab = "directory" | "supply" | "compare";
export default function DistributorsScreen() {
    const [tab, setTab] = useState<Tab>("directory");
    const { suppliers, supplyList } = usePharma();
    const preferred = preferredSupplyCount(supplyList);
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className={cn("!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5", "!mb-4.5")}>
        <Button className={tab === "directory" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick}>
          Distributors ({suppliers.length})
        </Button>
        <Button className={tab === "supply" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} data-preferred={preferred} onClick={setTabOnClick2}>
          Supply list ({supplyList.length})
        </Button>
        <Button className={tab === "compare" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick3}>
          Price compare
        </Button>
      </Box>
      {tab === "directory" && <Directory />}
      {tab === "supply" && <SupplyList />}
      {tab === "compare" && <PriceCompare />}
    </Box>);
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
