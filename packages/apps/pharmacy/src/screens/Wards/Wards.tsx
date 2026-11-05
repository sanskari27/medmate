import type { Ward } from "@/utils";
import { Box, Button, Heading, Progress, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import { AdmissionsTable } from "@/screens/Wards/components/AdmissionsTable";
import { WardSetupModal } from "@/screens/Wards/components/WardSetupModal";
import { AdmitModal } from "@/screens/Wards/components/AdmitModal";
import { AdmissionModal } from "@/screens/Wards/components/AdmissionModal";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { WardType, wardBedNos, occupiedBedsOf, admissionAtBed, hospitalOccupancy, activeAdmissions, } from "@/utils/calculations/hospital";
import { IconPlus, IconSettings } from "@/components/Icon";
const TYPE_TONE: Record<WardType, string> = {
    ICU: "!bg-rose-bg !text-rose",
    General: "!bg-gray-pill !text-muted",
    Surgical: "!bg-blue-bg !text-blue",
    Pediatric: "!bg-amber-bg !text-gold-d",
    Maternity: "!bg-teal-bg !text-teal",
    Private: "!bg-wash !text-mid",
};
export default function WardsScreen() {
    const { wards, admissions, sales, now } = usePharma();
    const [tab, setTab] = useState<"beds" | "admissions">("beds");
    const [setup, setSetup] = useState(false);
    const [admit, setAdmit] = useState<{
        wardId: string;
        bed: string;
    } | true | null>(null);
    const [viewAdm, setViewAdm] = useState<string | null>(null);
    const occ = hospitalOccupancy(wards, admissions);
    const active = activeAdmissions(admissions);
    const current = admissions.find((a) => a.id === viewAdm) ?? null;
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className={cn("!mb-3.5 !flex !flex-wrap !gap-2.5", "!mb-4")}>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Wards<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{wards.length}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Total beds<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{occ.beds}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Occupied<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{occ.occ}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Free<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{occ.free}</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Occupancy<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{occ.pct}%</Text>
        </Box>
        <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
          Admitted<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{active.length}</Text>
        </Box>
      </Box>

      <Box className="!mb-4 !flex !flex-wrap !items-center !gap-2.5">
        <Box className="!inline-flex !max-w-full !flex-wrap !gap-0.5 !rounded-sm !border !border-line !bg-wash-2 !p-0.5">
          <Button className={tab === "beds" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick}>
            Bed map
          </Button>
          <Button className={tab === "admissions" ? "!border-0 !bg-paper !text-dark !shadow-sm !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold" : "!border-0 !bg-transparent !text-muted !shadow-none !rounded-[6px] !px-[13px] !py-1.5 !text-[12.5px] !font-bold"} onClick={setTabOnClick2}>
            Admissions ({active.length})
          </Button>
        </Box>
        <Box className="!flex-1"/>
        <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={setSetupOnClick}>
          <IconSettings size={14}/> Manage wards
        </Button>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setAdmitOnClick}>
          <IconPlus size={16}/> Admit patient
        </Button>
      </Box>

      {tab === "beds" ? (<Box className={cn("!grid !grid-cols-[repeat(auto-fill,minmax(280px,1fr))] !gap-3.5", "!mt-4")}>
          {wards.map(renderWard)}
        </Box>) : (<AdmissionsTable admissions={active} sales={sales} now={now} onOpen={setViewAdm}/>)}

      {setup && <WardSetupModal onClose={setSetupOnClose}/>}
      {admit && (<AdmitModal preset={admit === true ? null : admit} onClose={setAdmitOnClose} onAdmitted={setAdmitOnAdmitted}/>)}
      {current && <AdmissionModal adm={current} onClose={setViewAdmOnClose}/>}
    </Box>);
    function setTabOnClick() {
        return setTab("beds");
    }
    function setTabOnClick2() {
        return setTab("admissions");
    }
    function setSetupOnClick() {
        return setSetup(true);
    }
    function setAdmitOnClick() {
        return setAdmit(true);
    }
    function renderWard(w: Ward) {
        const occSet = occupiedBedsOf(admissions, w.id);
        const beds = wardBedNos(w);
        const pct = w.beds ? Math.round((occSet.size / w.beds) * 100) : 0;
        return (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]" key={w.id}>
                <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !items-start")}>
                  <Box>
                    <Heading className={cn("!text-[16px]")} level={3}>{w.name}</Heading>
                    <Box className={cn("!text-muted", "!text-[12.5px] !mt-0.5")}>
                      {w.code} · {w.floor} · {w.sister}
                    </Box>
                  </Box>
                  <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${TYPE_TONE[w.type]}`} as="span">{w.type}</Text>
                </Box>
                <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !text-[12.5px] !mt-3 !mx-0 !mb-[5px]")}>
                  <Text className="!text-muted" as="span">
                    {occSet.size}/{w.beds} beds occupied
                  </Text>
                  <Text as="span" className={cn("font-bold", pct >= 85 ? "!text-rose" : pct >= 60 ? "!text-amber" : "!text-mid")}>
                    {pct}%
                  </Text>
                </Box>
                <Progress className="!h-2 !rounded-[5px]" value={pct} tone={pct >= 85 ? "rose" : pct >= 60 ? "amber" : "mid"} label="Beds occupied"/>
                <Box className="!mt-3.5 !grid !grid-cols-[repeat(auto-fill,minmax(76px,1fr))] !gap-[7px]">
                  {beds.map(renderBed)}
                </Box>
              </Box>);
        function renderBed(bed: string) {
            const a = admissionAtBed(admissions, w.id, bed);
            return (<Button key={bed} className={`!flex !min-h-[50px] !flex-col !items-center !justify-center !gap-0.5 !rounded-[10px] !border !border-line-2 !bg-paper !px-1 !py-2 ${a ? "!border-[#f3c0c0] !bg-rose-bg" : "!border-dashed hover:!border-mid hover:!bg-wash-2"}`} title={a ? `${a.name} · ${a.patientId}` : `${bed} · free`} onClick={setViewAdmOnClick}>
                        <Text className={a ? "font-mono text-[10px] font-bold text-rose" : "font-mono text-[10px] font-bold text-muted"} as="span">{bed}</Text>
                        <Text className={a ? "max-w-full truncate text-[11px] font-bold text-rose" : "max-w-full truncate text-[11px] font-bold text-mid"} as="span">{a ? a.name.split(" ")[0] : "+ Free"}</Text>
                      </Button>);
            function setViewAdmOnClick() {
                return (a ? setViewAdm(a.id) : setAdmit({ wardId: w.id, bed }));
            }
        }
    }
    function setSetupOnClose() {
        return setSetup(false);
    }
    function setAdmitOnClose() {
        return setAdmit(null);
    }
    function setAdmitOnAdmitted(id: string) {
        setAdmit(null);
        setViewAdm(id);
    }
    function setViewAdmOnClose() {
        return setViewAdm(null);
    }
}
