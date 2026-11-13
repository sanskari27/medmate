import { useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { FilterField } from "@/components/ui/FilterField";
import { Heading } from "@/components/ui/Heading";
import { IconOffer, IconPlus, IconTag } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { problemMessage, useAuthState } from "@/features/authentication";
import { cn } from "@/utils/className";
import { OfferDialog } from "../../components/OfferDialog";
import {
  useCreateOfferMutation,
  useDeleteOfferMutation,
  useListOffersQuery,
  useUpdateOfferMutation,
} from "../../offers.api";
import {
  appliesLabel,
  discountLabel,
  offerAccess,
  payload,
  type Offer,
  type OfferDraft,
} from "../../model";

export function OffersPage() {
  const { session } = useAuthState();
  const access = offerAccess(session?.account.pharmacyRole, session?.account.permissions);
  const list = useListOffersQuery();
  const [createOffer, createState] = useCreateOfferMutation();
  const [updateOffer, updateState] = useUpdateOfferMutation();
  const [removeOffer, removeState] = useDeleteOfferMutation();
  const [dialog, setDialog] = useState<Offer | "create" | null>(null);
  const [removing, setRemoving] = useState<Offer | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "paused">("all");
  const offers = list.data?.offers ?? [];
  const needle = query.trim().toLowerCase();
  const shown = offers.filter((offer) => {
    if (status === "active" && !offer.active) return false;
    if (status === "paused" && offer.active) return false;
    if (!needle) return true;
    return `${offer.title} ${offer.code}`.toLowerCase().includes(needle);
  });
  const saving = createState.isLoading || updateState.isLoading;
  const saveError = dialog === "create" ? createState : updateState;
  const dialogError = saveError.isError
    ? problemMessage(saveError.error, "Could not save the offer")
    : null;

  async function save(draft: OfferDraft) {
    const body = payload(draft);
    const result =
      dialog === "create" ? createOffer(body) : updateOffer({ id: (dialog as Offer).id, body });
    try {
      await result.unwrap();
      setDialog(null);
    } catch {
      return;
    }
  }

  async function confirmDelete() {
    if (!removing) return;
    try {
      await removeOffer(removing.id).unwrap();
      setRemoving(null);
    } catch {
      return;
    }
  }

  if (list.isLoading) return <Text className="text-[13.5px] text-muted">Loading offers</Text>;

  return (
    <Box className="mx-auto max-w-[1680px]">
      <Stack direction="row" align="end" wrap className="mb-4 gap-3">
        <Heading level={2} className="text-[16px]">
          Active & scheduled offers
        </Heading>
        <Box className="flex-1" />
        <FilterField label="Search" className="w-[240px]">
          <Input
            aria-label="Search offers"
            placeholder="Search title or code…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </FilterField>
        <FilterField label="Status">
          <Select
            aria-label="Offer status"
            value={status}
            onChange={(event) => setStatus(event.target.value as "all" | "active" | "paused")}
            className="min-w-[140px]"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </Select>
        </FilterField>
        {access.create ? (
          <Button type="button" onClick={() => setDialog("create")}>
            <IconPlus size={16} /> Create offer
          </Button>
        ) : null}
      </Stack>
      {list.isError ? (
        <Text className="mb-3 text-[12.5px] font-bold text-rose">
          {problemMessage(list.error, "Could not load offers")}
        </Text>
      ) : null}
      {!list.isError && offers.length === 0 ? (
        <Box className="flex flex-col rounded-md border border-line bg-paper p-[18px] shadow-sm">
          <Box className="px-5 py-9 text-center text-muted">
            <Box className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-xl bg-wash text-mid">
              <IconTag size={30} />
            </Box>
            <Heading level={3} className="mb-[5px] text-[15px]">
              No offers yet
            </Heading>
            <Text>Create a discount to attract online customers.</Text>
          </Box>
        </Box>
      ) : null}
      {offers.length > 0 && shown.length === 0 ? (
        <Text className="text-[13.5px] text-muted">No offers match this filter.</Text>
      ) : null}
      {shown.length > 0 ? (
        <Box className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4">
          {shown.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              canUpdate={access.update}
              canDelete={access.delete}
              onToggle={() => void updateOffer({ id: offer.id, body: { active: !offer.active } })}
              onEdit={() => setDialog(offer)}
              onDelete={() => setRemoving(offer)}
            />
          ))}
        </Box>
      ) : null}
      {dialog ? (
        <OfferDialog
          offer={dialog === "create" ? null : dialog}
          saving={saving}
          error={dialogError}
          onClose={() => setDialog(null)}
          onSave={(draft) => void save(draft)}
        />
      ) : null}
      {removing ? (
        <Box
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
          onClick={() => setRemoving(null)}
        >
          <Box
            role="dialog"
            aria-modal="true"
            aria-label="Delete this offer?"
            className="w-full max-w-[420px] rounded-lg bg-paper p-5 shadow-pop"
            onClick={(event) => event.stopPropagation()}
          >
            <Heading level={3} className="text-[17px]">
              Delete this offer?
            </Heading>
            <Text className="mt-2 text-[13.5px] text-ink-2">{removing.title}</Text>
            {removeState.isError ? (
              <Text className="mt-3 text-[12.5px] font-bold text-rose">
                {problemMessage(removeState.error, "Could not delete the offer")}
              </Text>
            ) : null}
            <Stack direction="row" justify="end" className="mt-5 gap-2.5">
              <Button type="button" variant="ghost" onClick={() => setRemoving(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="rose"
                disabled={removeState.isLoading}
                onClick={() => void confirmDelete()}
              >
                Delete
              </Button>
            </Stack>
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}

function OfferCard({
  offer,
  canUpdate,
  canDelete,
  onToggle,
  onEdit,
  onDelete,
}: {
  offer: Offer;
  canUpdate: boolean;
  canDelete: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Box
      className={cn(
        "flex flex-col rounded-md border border-line bg-paper shadow-sm",
        offer.active ? "opacity-100" : "opacity-[0.62]",
      )}
    >
      <Box className="flex-1 p-[18px]">
        <Stack direction="row" align="center" justify="between" className="mb-2.5">
          <Box className="grid h-[42px] w-[42px] place-items-center rounded-[11px] bg-gradient-to-br from-gold to-gold-d text-paper">
            <IconOffer size={22} />
          </Box>
          {canUpdate ? (
            <Button
              type="button"
              aria-label="Toggle offer"
              className={cn(
                "relative h-[22px] w-[38px] shrink-0 rounded-full border-0 p-0 shadow-none after:absolute after:top-0.5 after:left-0.5 after:h-[18px] after:w-[18px] after:rounded-full after:bg-white after:shadow-[0_1px_3px_rgba(0,0,0,0.22)] after:transition after:content-['']",
                offer.active
                  ? "bg-mid after:translate-x-4 hover:bg-mid"
                  : "bg-[#cddcd3] hover:bg-[#cddcd3]",
              )}
              onClick={onToggle}
            />
          ) : null}
        </Stack>
        <Heading level={3} className="text-[15px]">
          {offer.title}
        </Heading>
        <Stack direction="row" align="center" className="mt-2 flex-wrap gap-1.5">
          <Text
            as="span"
            className="inline-flex items-center rounded-full bg-wash px-[9px] py-[3px] text-[11px] font-bold text-mid"
          >
            {discountLabel(offer.type, offer.value)}
          </Text>
          <Text
            as="span"
            className="inline-flex items-center rounded-xs border border-line-2 bg-paper px-[7px] py-0.5 font-mono text-[10.5px] font-bold text-ink-2"
          >
            {offer.code}
          </Text>
        </Stack>
        <Text className="mt-2.5 text-[12.5px] text-muted">
          Applies to{" "}
          <Text as="span" className="font-bold">
            {appliesLabel(offer.scope)}
          </Text>{" "}
          · {offer.itemCount} items
        </Text>
      </Box>
      <Stack
        direction="row"
        align="center"
        justify="between"
        className="mt-auto gap-2.5 border-t border-line px-5 py-3.5"
      >
        <Text
          as="span"
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-[9px] py-[3px] text-[11px] font-bold",
            offer.active ? "bg-wash text-mid" : "bg-gray-pill text-muted",
          )}
        >
          <Box className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
          {offer.active ? "Running" : "Paused"}
        </Text>
        <Stack direction="row" className="gap-2">
          {canUpdate ? (
            <Button type="button" variant="line" size="sm" onClick={onEdit}>
              Edit
            </Button>
          ) : null}
          {canDelete ? (
            <Button type="button" variant="rose" size="sm" onClick={onDelete}>
              Delete
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </Box>
  );
}
