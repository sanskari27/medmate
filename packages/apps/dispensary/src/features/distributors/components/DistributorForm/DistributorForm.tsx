import { useState, type ChangeEvent } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Heading } from "@/components/ui/Heading";
import { Input } from "@/components/ui/Input";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  PAYMENT_TERMS,
  blankDraft,
  draftFromDistributor,
  draftIsValid,
  isValidGstin,
  type Distributor,
  type DistributorAccess,
  type DistributorDraft,
} from "../../model";

const selectClass =
  "w-full rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink outline-none focus:border-mid focus:shadow-focus disabled:bg-[#e9efeb] disabled:text-faint";

export function DistributorForm({
  distributor,
  access,
  saving,
  error,
  onClose,
  onSave,
}: {
  distributor: Distributor | null;
  access: DistributorAccess;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (draft: DistributorDraft) => void;
}) {
  const [form, setForm] = useState<DistributorDraft>(
    distributor ? draftFromDistributor(distributor) : blankDraft(),
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const locked = Boolean(distributor) && !access.update;
  const balanceLocked = Boolean(distributor && distributor.transactions.length > 0);
  const canSave = draftIsValid(form);
  const showSave = distributor
    ? access.update || (access.inactivate && !form.active && distributor.active)
    : access.create;
  const title = distributor ? "Edit distributor" : "Add distributor";

  function patch(next: Partial<DistributorDraft>) {
    setForm((current) => ({ ...current, ...next }));
  }

  function save() {
    if (form.gstin.trim() && !isValidGstin(form.gstin)) {
      setLocalError("Enter a valid GSTIN");
      return;
    }
    setLocalError(null);
    onSave(form);
  }

  return (
    <Box
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[640px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Heading level={3}>{title}</Heading>
          <Button type="button" variant="ghost" size="sm" aria-label="Close" onClick={onClose}>
            Close
          </Button>
        </Stack>
        <Box className="overflow-y-auto px-5 py-4">
          <Stack className="gap-4">
            <Section title="Basic information" />
            <Box className="grid gap-3 md:grid-cols-2">
              <Field label="Distributor / firm name *" className="md:col-span-2">
                <Input
                  aria-label="Distributor / firm name"
                  value={form.name}
                  disabled={locked}
                  placeholder="e.g. Bengaluru Pharma Distributors"
                  onChange={(event) => patch({ name: event.target.value })}
                />
              </Field>
              <Field label="Contact person">
                <Input
                  aria-label="Contact person"
                  value={form.contactPerson}
                  disabled={locked}
                  onChange={(event) => patch({ contactPerson: event.target.value })}
                />
              </Field>
              <Field label="Phone number *">
                <Input
                  aria-label="Phone number"
                  value={form.phone}
                  disabled={locked}
                  placeholder="+91 …"
                  onChange={(event) => patch({ phone: event.target.value })}
                />
              </Field>
              <Field label="Email address" className="md:col-span-2">
                <Input
                  aria-label="Email address"
                  value={form.email}
                  disabled={locked}
                  onChange={(event) => patch({ email: event.target.value })}
                />
              </Field>
            </Box>
            <Section title="Legal & registration" />
            <Box className="grid gap-3 md:grid-cols-2">
              <Field label="GSTIN">
                <Input
                  aria-label="GSTIN"
                  className="font-mono"
                  value={form.gstin}
                  disabled={locked}
                  placeholder="29ABCDE1234F1Z5"
                  onChange={(event) => patch({ gstin: event.target.value.toUpperCase() })}
                />
              </Field>
              <Field label="Drug licence number">
                <Input
                  aria-label="Drug licence number"
                  className="font-mono"
                  value={form.drugLicenceNumber}
                  disabled={locked}
                  placeholder="KA-W-…"
                  onChange={(event) =>
                    patch({ drugLicenceNumber: event.target.value.toUpperCase() })
                  }
                />
              </Field>
            </Box>
            <Section title="Address" />
            <Box className="grid gap-3 md:grid-cols-2">
              <Field label="Address" className="md:col-span-2">
                <Input
                  aria-label="Address"
                  value={form.address}
                  disabled={locked}
                  onChange={(event) => patch({ address: event.target.value })}
                />
              </Field>
              <Field label="City">
                <Input
                  aria-label="City"
                  value={form.city}
                  disabled={locked}
                  onChange={(event) => patch({ city: event.target.value })}
                />
              </Field>
              <Field label="State">
                <Input
                  aria-label="State"
                  value={form.state}
                  disabled={locked}
                  onChange={(event) => patch({ state: event.target.value })}
                />
              </Field>
            </Box>
            <Section title="Financial information" />
            <Box className="grid gap-3 md:grid-cols-2">
              <Field label="Payment terms">
                <select
                  aria-label="Payment terms"
                  className={selectClass}
                  value={form.paymentTerms}
                  disabled={locked}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    patch({ paymentTerms: event.target.value })
                  }
                >
                  {PAYMENT_TERMS.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Outstanding payable (₹)">
                <Input
                  aria-label="Outstanding payable"
                  type="number"
                  min={0}
                  value={form.openingBalance}
                  disabled={locked || balanceLocked}
                  onChange={(event) => patch({ openingBalance: event.target.value })}
                />
              </Field>
            </Box>
            <Section title="Status & availability" />
            <Box className="grid gap-3 md:grid-cols-2">
              <Field label="Active status">
                <select
                  aria-label="Active status"
                  className={selectClass}
                  value={form.active ? "active" : "inactive"}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                    patch({ active: event.target.value === "active" })
                  }
                >
                  <option value="active">Active</option>
                  <option value="inactive" disabled={!access.inactivate && form.active}>
                    Inactive
                  </option>
                </select>
              </Field>
              <Stack direction="row" align="center" className="gap-2 md:mt-7">
                <input
                  id="show-in-purchases"
                  type="checkbox"
                  className="h-4 w-4 accent-mid"
                  checked={form.showInPurchases}
                  disabled={locked}
                  onChange={(event) => patch({ showInPurchases: event.target.checked })}
                />
                <label htmlFor="show-in-purchases" className="text-[13px] font-semibold text-ink">
                  Show in purchases & reorder lists
                </label>
              </Stack>
            </Box>
          </Stack>
          {localError || error ? (
            <Text className="mt-3 text-[12.5px] font-bold text-rose">{localError || error}</Text>
          ) : null}
        </Box>
        <Stack direction="row" justify="end" className="gap-2 border-t border-line px-5 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {showSave ? (
            <Button type="button" disabled={!canSave || saving} onClick={save}>
              {distributor ? "Save changes" : "Add distributor"}
            </Button>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}

function Section({ title }: { title: string }) {
  return (
    <Heading
      level={4}
      className="border-b border-line pb-1.5 text-[13px] font-extrabold tracking-[0.04em] text-muted uppercase"
    >
      {title}
    </Heading>
  );
}
