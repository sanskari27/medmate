import type { DoctorProfile } from "@/utils";
import { Box, Button, Heading, Input, Label, Select, Text } from "@/components/atoms";
import { cn } from "@/utils/className";
import type { ChangeEvent } from "react";
import { useState } from "react";
import { usePharma } from "@/hooks";
import { Department } from "@/utils/calculations/hospital";
import { IconPlus, IconEdit, IconX } from "@/components/atoms";
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
    if (!form?.name.trim()) return;
    const body = { name: form.name.trim(), head: form.head.trim(), type: form.type };
    const fault = editing ? await updateDepartment(editing, body) : await addDepartment(body);
    if (fault) return;
    setForm(null);
    setEditing(null);
  };
  return (
    <Box className="!mx-auto !max-w-[1680px]">
      <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !mb-4")}>
        <Box className="!mb-3.5 !flex !flex-wrap !gap-2.5">
          <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
            Departments
            <Text
              as="span"
              className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
            >
              {departments.length}
            </Text>
          </Box>
          <Box className="!rounded-[10px] !border !border-line !bg-paper !px-3.5 !py-2 !text-[12.5px] !text-muted ">
            Doctors
            <Text
              as="span"
              className="font-bold mt-px block font-display text-[15px] font-bold text-dark"
            >
              {doctors.length}
            </Text>
          </Box>
        </Box>
        <Button variant="primary" onClick={setEditingOnClick}>
          <IconPlus size={15} /> Add department
        </Button>
      </Box>

      {form && (
        <Box
          className={cn(
            "!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]",
            "!mb-4",
          )}
        >
          <Box className={cn("!flex !items-center !gap-2.5", "!justify-between")}>
            <Heading level={3}>{editing ? "Edit department" : "New department"}</Heading>
            <Button variant="ghost" onClick={setFormOnClick}>
              <IconX size={15} />
            </Button>
          </Box>
          <Box
            className={cn("!grid !grid-cols-[1.5fr_1fr] !gap-4 max-[767px]:!grid-cols-1", "!mt-3")}
          >
            <Box
              className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2"
              data-field="name"
            >
              <Label>Name</Label>
              <Input className="" value={form.name} onChange={setFormOnChange} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Head</Label>
              <Input className="" value={form.head} onChange={setFormOnChange2} />
            </Box>
            <Box className="!flex !flex-col !gap-1.5 [&_label]:!text-[11.5px] [&_label]:!font-bold [&_label]:!tracking-wide [&_label]:!text-ink-2">
              <Label>Type</Label>
              <Select
                className=""
                value={form.type}
                onChange={setFormOnChange3}
                options={[...TYPES.map(renderTYPES)]}
              />
            </Box>
          </Box>
          <Button variant="primary" onClick={saveOnClick} className="!mt-3">
            Save
          </Button>
        </Box>
      )}

      {departments.length === 0 ? (
        <Box className="!px-5 !py-9 !text-center !text-muted">
          <Text className="!mx-auto !max-w-[340px] !text-[13px] !text-muted">
            No departments yet.
          </Text>
        </Box>
      ) : (
        <Box className="!grid !grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] !gap-4">
          {departments.map(renderDepartment)}
        </Box>
      )}
    </Box>
  );
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
    return setForm((current) =>
      current ? { ...current, type: e.target.value as Department["type"] } : current,
    );
  }
  function renderTYPES(t: "OPD" | "IPD" | "Diagnostic" | "Support") {
    return { value: String(t), label: String(t) };
  }
  function saveOnClick() {
    return void save();
  }
  function renderDepartment(d: Department) {
    const linked = inDept(d.name);
    return (
      <Box
        className="!flex !flex-col !rounded-md !border !border-line !bg-paper !shadow-sm !flex-1 !p-[18px]"
        key={d.id}
      >
        <Box className={cn("!flex !items-center !gap-2.5", "!justify-between !items-start")}>
          <Box>
            <Heading className={cn("!text-[15.5px]")} level={3}>
              {d.name}
            </Heading>
            <Text className="!text-[12.5px] !text-muted">Head: {d.head || "—"}</Text>
          </Box>
          <Text
            className={`!inline-flex !items-center !gap-1 !whitespace-nowrap !rounded-full !px-[9px] !py-[3px] !text-[11px] !font-bold ${TYPE_TONE[d.type] ?? "!bg-gray-pill !text-muted"}`}
            as="span"
          >
            {d.type}
          </Text>
        </Box>
        <Box className="!mt-2.5 !flex !flex-col !gap-1.5 !border-t !border-dashed !border-line-2 !pt-2.5">
          {linked.length === 0 ? (
            <Box className="!flex !justify-between !gap-2.5 !text-[13px]">
              <Text className="!text-[13px] !text-muted" as="span">
                No doctors in this department
              </Text>
            </Box>
          ) : (
            linked.map(renderLinked)
          )}
        </Box>
        <Box className="!mt-2.5 !flex !items-center !gap-1.5">
          <Button variant="ghost" onClick={setEditingOnClick2}>
            <IconEdit size={14} /> Edit
          </Button>
        </Box>
      </Box>
    );
    function renderLinked(doc: DoctorProfile) {
      return (
        <Box className="!flex !justify-between !gap-2.5 !text-[13px] !text-ink-2" key={doc.id}>
          <Text className="!text-[13px] !text-ink-2" as="span">
            {doc.name} ·{" "}
            <Text as="span" className="!text-[13px] !not-italic !text-muted">
              {doc.specialty}
            </Text>
          </Text>
          <Text as="span" className="!whitespace-nowrap !font-display !font-bold !text-dark">
            {doc.opdRoom ?? "—"}
          </Text>
        </Box>
      );
    }
    function setEditingOnClick2() {
      setEditing(d.id);
      setForm({ name: d.name, head: d.head, type: d.type });
    }
  }
}
