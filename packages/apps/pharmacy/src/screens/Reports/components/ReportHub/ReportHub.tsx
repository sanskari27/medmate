import type { ReportHubProps } from "./ReportHub.types";
import { Box, Button, Input, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState, ReactNode } from "react";
import {
  IconSearch,
  IconSparkle,
  IconReceipt,
  IconDoc,
  IconBox,
  IconUsers,
  IconStar,
} from "@/components/atoms";
import {
  REPORT_CATALOG,
  CAT_LABEL,
  ReportCat,
  ReportMeta,
} from "@/utils/calculations/reportCatalog";
const CAT_ICON: Record<ReportCat, ReactNode> = {
  favourite: <IconSparkle size={15} />,
  gst: <IconReceipt size={15} />,
  transaction: <IconDoc size={15} />,
  item: <IconBox size={15} />,
  party: <IconUsers size={15} />,
};
const FILTER_PRED: Record<string, (m: ReportMeta) => boolean> = {
  Party: (m) => m.cat === "party",
  Category: (m) => /categor/i.test(m.name) || m.cat === "item",
  "Payment Collection": (m) =>
    [
      "cash-bank",
      "receivable-ageing",
      "party-outstanding",
      "party-ledger",
      "tcs-receivable",
      "tds-payable",
      "tds-receivable",
    ].includes(m.id),
  Item: (m) => m.cat === "item",
  "Invoice Details": (m) =>
    [
      "audit-trail",
      "bill-wise-profit",
      "gstr1",
      "gst-sales-hsn",
      "sales-summary",
      "purchase-summary",
    ].includes(m.id),
  Summary: (m) => /summary/i.test(m.name) || m.fav === true,
};
const FILTERS = Object.keys(FILTER_PRED);
export function ReportHub({ onOpen }: ReportHubProps) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState<string | null>(null);
  const match = (m: ReportMeta) =>
    (!q.trim() ||
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.desc.toLowerCase().includes(q.toLowerCase())) &&
    (!active || FILTER_PRED[active](m));
  const favourites = REPORT_CATALOG.filter((m) => m.fav && match(m));
  const groups: {
    cat: ReportCat;
    items: ReportMeta[];
  }[] = (["gst", "transaction", "item", "party"] as ReportCat[]).map((cat) => ({
    cat,
    items: REPORT_CATALOG.filter((m) => m.cat === cat && !m.fav && match(m)),
  }));
  function ReportCard({ m }: { m: ReportMeta }) {
    function openReport() {
      onOpen(m);
    }
    return (
      <Button
        className="!flex !h-auto !w-full !items-center !justify-between !rounded-[7px] !border-0 !bg-transparent !px-[2px] !py-[9px] !text-left !text-[14px] !font-normal !text-ink !shadow-none hover:!bg-wash-2 hover:!px-2 hover:!text-green"
        onClick={openReport}
      >
        <Text className="!font-medium" as="span">
          {m.name}
        </Text>
        {m.fav && (
          <Text className="text-[15px] text-gold" as="span">
            <IconStar size={13} />
          </Text>
        )}
      </Button>
    );
  }
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap !items-center")}>
          <Text
            className="!mr-0.5 !text-[10.5px] !font-bold !tracking-[0.07em] !text-muted !uppercase"
            as="span"
          >
            Filter by
          </Text>
          {FILTERS.map(renderFILTERS)}
        </Box>
        <Box className="!flex-1" />
        <Box className="!flex !max-w-[360px] !min-w-[240px] !flex-1 !items-center !gap-2 !rounded-sm !border !border-line-2 !bg-paper !px-3 !py-2 [&_input]:!w-full [&_input]:!border-0 [&_input]:!bg-transparent [&_input]:!text-[13.5px] [&_input]:!text-ink [&_input]:!outline-none">
          <Text className="!text-green" as="span">
            <IconSearch size={17} />
          </Text>
          <Input placeholder="Find report…" value={q} onChange={setQOnChange} />
        </Box>
      </Box>

      <Box className="!grid !grid-cols-3 !gap-x-[38px] max-[1099px]:!grid-cols-2 max-[767px]:!grid-cols-1">
        <Box className="!border-t !border-line !pt-1.5">
          <Box className="!flex !items-center !gap-[7px] !px-0.5 !pt-3 !pb-2 !font-display !text-[13.5px] !font-extrabold !text-muted">
            {CAT_ICON.favourite} Favourite
          </Box>
          {favourites.map(renderFavourite)}
          {favourites.length === 0 && (
            <Box className={cn("!text-muted", "!py-2 !px-0.5 !text-[12.5px]")}>No matches</Box>
          )}
        </Box>
        {groups.map(renderGroup)}
      </Box>
    </Box>
  );
  function renderFILTERS(f: string) {
    return (
      <Button
        key={f}
        className={`!inline-flex !h-auto !items-center !gap-[7px] !rounded-full !border !border-line-2 !bg-paper !px-3.5 !py-[7px] !text-[12.5px] !font-bold !text-ink-2 !shadow-none hover:!border-[#b9d0c2] hover:!bg-wash-2 max-[767px]:!min-h-10 ${active === f ? " !border-dark !bg-dark !text-white hover:!bg-dark" : ""}`}
        onClick={setActiveOnClick}
      >
        {f}
      </Button>
    );
    function setActiveOnClick() {
      return setActive((a) => (a === f ? null : f));
    }
  }
  function setQOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setQ(e.target.value);
  }
  function renderFavourite(m: ReportMeta) {
    return <ReportCard key={m.id} m={m} />;
  }
  function renderGroup(g: { cat: ReportCat; items: ReportMeta[] }) {
    return (
      <Box className="!border-t !border-line !pt-1.5" key={g.cat}>
        <Box className="!flex !items-center !gap-[7px] !px-0.5 !pt-3 !pb-2 !font-display !text-[13.5px] !font-extrabold !text-muted">
          {CAT_ICON[g.cat]} {CAT_LABEL[g.cat]}
        </Box>
        {g.items.map(renderItem)}
        {g.items.length === 0 && (
          <Box className={cn("!text-muted", "!py-2 !px-0.5 !text-[12.5px]")}>No matches</Box>
        )}
      </Box>
    );
    function renderItem(m: ReportMeta) {
      return <ReportCard key={m.id} m={m} />;
    }
  }
}
