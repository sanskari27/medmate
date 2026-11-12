import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { applicationSubmitted, problemMessage, useAuthState } from "@/features/authentication";
import { BrandingCard } from "../../components/BrandingCard";
import { ContentCard } from "../../components/ContentCard";
import { InvoicePreview } from "../../components/InvoicePreview";
import { SaveConfirm } from "../../components/SaveConfirm";
import { TemplateCard } from "../../components/TemplateCard";
import {
  useReadInvoiceSettingsQuery,
  useUpdateInvoiceSettingsMutation,
} from "../../invoiceSettings.api";
import {
  canUpdateInvoiceSettings,
  draftFromSettings,
  isDirty,
  signatureChanged,
  toFormData,
  type InvoiceDraft,
} from "../../model";

export function InvoiceSettingsPage() {
  const { session } = useAuthState();
  const dispatch = useDispatch();
  const canUpdate = canUpdateInvoiceSettings(
    session?.account.pharmacyRole,
    session?.account.permissions,
  );
  const settings = useReadInvoiceSettingsQuery();
  const [updateSettings, update] = useUpdateInvoiceSettingsMutation();
  const [baseline, setBaseline] = useState<InvoiceDraft | null>(null);
  const [draft, setDraft] = useState<InvoiceDraft | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settings.data) return;
    const next = draftFromSettings(settings.data);
    setBaseline(next);
    setDraft(next);
  }, [settings.data]);

  function patch(partial: Partial<InvoiceDraft>) {
    setDraft((current) => (current ? { ...current, ...partial } : current));
  }

  async function confirmSave() {
    if (!draft) return;
    setError(null);
    try {
      const saved = await updateSettings(toFormData(draft)).unwrap();
      dispatch(
        applicationSubmitted({
          status: saved.status,
          rejection: saved.rejection,
          pinSetupRequired: saved.pinSetupRequired,
          displayName: session?.account.displayName ?? null,
        }),
      );
      if (saved.status === "approved") {
        const next = draftFromSettings(saved);
        setBaseline(next);
        setDraft(next);
      }
      setConfirming(false);
    } catch (caught) {
      setError(problemMessage(caught, "Could not save invoice settings"));
    }
  }

  if (settings.isError) return <Text>Could not load invoice settings</Text>;
  if (!draft || !baseline || !settings.data) return <Text>Loading invoice settings</Text>;
  const dirty = isDirty(baseline, draft);
  const review = signatureChanged(draft);
  return (
    <>
      <Box className="mx-auto grid w-full max-w-[1680px] items-start gap-[18px] grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] max-[1080px]:grid-cols-1">
        <Stack className="min-w-0 gap-4">
          <fieldset disabled={!canUpdate} className="m-0 flex min-w-0 flex-col gap-4 border-0 p-0">
            <TemplateCard draft={draft} disabled={!canUpdate} onChange={patch} />
            <BrandingCard
              draft={draft}
              logo={settings.data.logo}
              signature={settings.data.signature}
              disabled={!canUpdate}
              onChange={patch}
            />
            <ContentCard draft={draft} disabled={!canUpdate} onChange={patch} />
          </fieldset>
          {canUpdate ? (
            <Stack direction="row" justify="center" className="border-t border-line pt-4">
              <Button
                type="button"
                disabled={!dirty || update.isLoading}
                onClick={() => setConfirming(true)}
              >
                Save
              </Button>
            </Stack>
          ) : null}
        </Stack>
        <InvoicePreview
          draft={draft}
          logo={settings.data.logo}
          signature={settings.data.signature}
          pharmacy={settings.data.pharmacy}
        />
      </Box>
      {confirming ? (
        <SaveConfirm
          review={review}
          saving={update.isLoading}
          error={error}
          onCancel={() => {
            if (update.isLoading) return;
            setConfirming(false);
            setError(null);
          }}
          onConfirm={() => void confirmSave()}
        />
      ) : null}
    </>
  );
}
