import {
  Box,
  Button,
  Heading,
  Input,
  Label,
  Select,
  TableCell,
  TableRow,
  Text,
} from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { issueCoupon, loadCoupons } from "@/store/thunks/master.thunk";
import { Plan } from "@/utils";
import { plusDays } from "@/utils/date";
import { Table } from "@/screens/Master/components/Table";
import { makeCode } from "@/screens/Master/utils/makeCode";
export function CouponDesk() {
  const dispatch = useAppDispatch();
  const rows = useAppSelector((state) => state.master.coupons);
  const [code, setCode] = useState("");
  const [plan, setPlan] = useState<Plan>("Growth");
  const [expiresOn, setExpiresOn] = useState(plusDays(30));
  const [validDays, setValidDays] = useState(30);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void dispatch(loadCoupons())
      .unwrap()
      .catch((err: unknown) => {
        setError(typeof err === "string" ? err : "Could not load coupons");
      });
  }, [dispatch]);
  const issue = async () => {
    setError("");
    setBusy(true);
    try {
      await dispatch(issueCoupon({ code, plan, expiresOn, validDays })).unwrap();
      setCode("");
    } catch (err) {
      setError(typeof err === "string" ? err : "Could not issue the coupon");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Box>
      <Box
        className={cn(
          "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
          "!mb-4",
        )}
      >
        <Heading className={cn("!mb-2")} level={3}>
          Issue a coupon
        </Heading>
        <Text className={cn("!text-muted", "!text-[12.5px] !mb-3")}>
          The code works until the expiry date. Redeeming it turns on the plan for the validity
          days. Each pharmacy can redeem one coupon.
        </Text>
        {error && (
          <Text
            className="!mb-3 !rounded-sm !border !border-[#f3c0c0] !bg-rose-bg !px-3 !py-2.5 !text-[13px] !font-bold !text-rose"
            role="alert"
          >
            {error}
          </Text>
        )}
        <Box className={cn("!flex !items-center !gap-1.5", "!flex-wrap !items-end")}>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label htmlFor="issue-code">Code</Label>
            <Input
              id="issue-code"
              className=""
              value={code}
              autoComplete="off"
              onChange={setCodeOnChange}
            />
          </Box>
          <Button
            className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2"
            type="button"
            onClick={setCodeOnClick}
          >
            Generate
          </Button>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label htmlFor="issue-plan">Plan</Label>
            <Select
              id="issue-plan"
              className=""
              value={plan}
              onChange={setPlanOnChange}
              options={[...(["Care", "Growth", "Flagship"] as Plan[]).map(renderItem)]}
            />
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label htmlFor="issue-expiry">Coupon expiry</Label>
            <Input
              id="issue-expiry"
              className=""
              type="date"
              value={expiresOn}
              onChange={setExpiresOnOnChange}
            />
          </Box>
          <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
            <Label htmlFor="issue-days">Plan validity (days)</Label>
            <Input
              id="issue-days"
              className=""
              type="number"
              min={1}
              max={3650}
              value={validDays}
              onChange={setValidDaysOnChange}
            />
          </Box>
          <Button
            className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green"
            disabled={busy}
            onClick={issueOnClick}
          >
            Issue coupon
          </Button>
        </Box>
      </Box>
      <Table columns={["Code", "Plan", "Expires", "Validity", "Redeemed"]} empty="No coupons yet.">
        {rows.map(renderRow)}
      </Table>
    </Box>
  );
  function setCodeOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setCode(e.target.value.toUpperCase());
  }
  function setCodeOnClick() {
    return setCode(makeCode());
  }
  function setPlanOnChange(e: ChangeEvent<HTMLSelectElement>) {
    return setPlan(e.target.value as Plan);
  }
  function renderItem(item: Plan) {
    return { value: String(item), label: String(item) };
  }
  function setExpiresOnOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setExpiresOn(e.target.value);
  }
  function setValidDaysOnChange(e: ChangeEvent<HTMLInputElement>) {
    return setValidDays(Number(e.target.value));
  }
  function issueOnClick() {
    return void issue();
  }
  function renderRow(row: (typeof rows)[number]) {
    return (
      <TableRow key={row.code}>
        <TableCell>{row.code}</TableCell>
        <TableCell>{row.plan}</TableCell>
        <TableCell>{row.expiresOn}</TableCell>
        <TableCell>{row.validDays} days</TableCell>
        <TableCell>{row.redeemed}</TableCell>
      </TableRow>
    );
  }
}
