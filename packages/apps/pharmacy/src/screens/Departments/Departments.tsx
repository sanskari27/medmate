import type { DoctorProfile } from "@/utils";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { Department } from "@/utils/calculations/hospital";
import { IconPlus, IconEdit, IconX } from "@/components/Icon";
import { doctorsInDepartment } from "./Departments.utils";
const TYPES: Department["type"][] = ["OPD", "IPD", "Diagnostic", "Support"];
const TYPE_TONE: Record<string, string> = {
    OPD: "!bg-blue-bg !text-blue",
    IPD: "!bg-amber-bg !text-gold-d",
    Diagnostic: "!bg-teal-bg !text-teal",
    Support: "!bg-gray-pill !text-muted",
};
const blank = { name: "", head: "", type: "OPD" as Department["type"] };
export default function DepartmentsScreen() {
    const { departments, doctors, addDepartment, updateDepartment } = usePharma();
    const [form, setForm] = useState<typeof blank | null>(null);
    const [editing, setEditing] = useState<string | null>(null);
    const inDept = (name: string) => doctorsInDepartment(doctors, name);
    const save = async () => {
        if (!form?.name.trim())
            return;
        const body = { name: form.name.trim(), head: form.head.trim(), type: form.type };
        const fault = editing ? await updateDepartment(editing, body) : await addDepartment(body);
        if (fault)
            return;
        setForm(null);
        setEditing(null);
    };
    return (<Box className="!mx-auto !max-w-[1680px]">
      <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-4")}>
        <Box className="!mb-3.5 !flex !flex-wrap !gap-2.5">
          <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
            Departments<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{departments.length}</Text>
          </Box>
          <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
            Doctors<Text as="span" className="font-bold mt-px block font-display text-[15px] font-bold text-dark">{doctors.length}</Text>
          </Box>
        </Box>
        <Button className="!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green" onClick={setEditingOnClick}>
          <IconPlus size={15}/> Add department
        </Button>
      </Box>

      {form && (<Box className={cn("!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]", "!mb-4")}>
          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between")}>
            <Heading level={3}>{editing ? "Edit department" : "New department"}</Heading>
            <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={setFormOnClick}>
              <IconX size={15}/>
            </Button>
          </Box>
          <Box className={cn("!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1", "!mt-3")}>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2" data-field="name">
              <Label>Name</Label>
              <Input className="" value={form.name} onChange={setFormOnChange}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Head</Label>
              <Input className="" value={form.head} onChange={setFormOnChange2}/>
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Type</Label>
              <Select className="" value={form.type} onChange={setFormOnChange3} options={[...(TYPES.map(renderTYPES))]} />
            </Box>
          </Box>
          <Button onClick={saveOnClick} className={cn("!border-transparent !bg-mid !text-white !shadow-sm hover:!bg-green", "!mt-3")}>
            Save
          </Button>
        </Box>)}

      {departments.length === 0 ? (<Box className="!px-5 !py-9 !text-center !text-muted [&_h3]:!mb-[5px] [&_h3]:!text-[15px] [&_h3]:!font-bold [&_h3]:!text-ink">
          <Text>No departments yet.</Text>
        </Box>) : (<Box className="!grid !grid-cols-[repeat(auto-fill,minmax(280px,1fr))] !gap-3.5">
          {departments.map(renderDepartment)}
        </Box>)}
    </Box>);
    function setEditingOnClick() {
        setEditing(null);
        setForm(blank);
    }
    function setFormOnClick() {
        setForm(null);
        setEditing(null);
    }
    function setFormOnChange(e: ChangeEvent<HTMLInputElement>) {
        return setForm((current) => (current ? { ...current, name: e.target.value } : current));
    }
    function setFormOnChange2(e: ChangeEvent<HTMLInputElement>) {
        return setForm((current) => (current ? { ...current, head: e.target.value } : current));
    }
    function setFormOnChange3(e: ChangeEvent<HTMLSelectElement>) {
        return setForm((current) => (current ? { ...current, type: e.target.value as Department["type"] } : current));
    }
    function renderTYPES(t: "OPD" | "IPD" | "Diagnostic" | "Support") {
        return { value: String(t), label: String(t) };
    }
    function saveOnClick() {
        return void save();
    }
    function renderDepartment(d: Department) {
        const linked = inDept(d.name);
        return (<Box className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]" key={d.id}>
                <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !items-start")}>
                  <Box>
                    <Heading className={cn("!text-[15.5px]")} level={3}>{d.name}</Heading>
                    <Box className={cn("!text-muted", "!text-[12.5px]")}>
                      Head: {d.head || "—"}
                    </Box>
                  </Box>
                  <Text className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${TYPE_TONE[d.type] ??"!bg-gray-pill !text-muted"}`} as="span">{d.type}</Text>
                </Box>
                <Box className="!mt-2 !list-disc !pl-4 !text-[13px] !text-ink-2">
                  {linked.length === 0 ? (<Box className="list-item">
                      <Text className="!text-muted" as="span">No doctors in this department</Text>
                    </Box>) : (linked.map(renderLinked))}
                </Box>
                <Box className={cn("!flex !items-center !gap-1.5", "!mt-2.5")}>
                  <Button className="!border !border-line-2 !bg-paper !text-ink-2 !shadow-none hover:!bg-wash-2" onClick={setEditingOnClick2}>
                    <IconEdit size={14}/> Edit
                  </Button>
                </Box>
              </Box>);
        function renderLinked(doc: DoctorProfile) {
            return (<Box className="list-item" key={doc.id}>
                        <Text as="span">
                          {doc.name} ·{" "}
                          <Text as="span" className={cn("not-italic text-gold", "!text-muted", "!not-italic")}>
                            {doc.specialty}
                          </Text>
                        </Text>
                        <Text as="span" className="font-bold">{doc.opdRoom ?? "—"}</Text>
                      </Box>);
        }
        function setEditingOnClick2() {
            setEditing(d.id);
            setForm({ name: d.name, head: d.head, type: d.type });
        }
    }
}
