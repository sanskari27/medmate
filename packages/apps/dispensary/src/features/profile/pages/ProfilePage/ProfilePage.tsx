import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Text } from "@/components/ui/Text";
import { applicationSubmitted, problemMessage, useAuthState } from "@/features/authentication";
import { BusinessCard } from "../../components/BusinessCard";
import { CategoriesCard } from "../../components/CategoriesCard";
import { ExtraDetailsCard } from "../../components/ExtraDetailsCard";
import { InvoiceCard } from "../../components/InvoiceCard";
import { SaveBar } from "../../components/SaveBar";
import { SaveConfirm } from "../../components/SaveConfirm";
import { TaxCard } from "../../components/TaxCard";
import {
  formFromApplication,
  isDirty,
  needsReview,
  toFormData,
  type ProfileForm,
} from "../../model";
import { useReadProfileQuery, useUpdateProfileMutation } from "../../profile.api";

export function ProfilePage() {
  const { session } = useAuthState();
  const dispatch = useDispatch();
  const profile = useReadProfileQuery();
  const [updateProfile, update] = useUpdateProfileMutation();
  const [baseline, setBaseline] = useState<ProfileForm | null>(null);
  const [draft, setDraft] = useState<ProfileForm | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile.data) return;
    const next = formFromApplication(profile.data);
    setBaseline(next);
    setDraft(next);
  }, [profile.data]);

  function patch(partial: Partial<ProfileForm>) {
    setDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        ...partial,
        files: partial.files ? { ...current.files, ...partial.files } : current.files,
      };
    });
  }

  async function confirmSave() {
    if (!draft) return;
    setError(null);
    try {
      const saved = await updateProfile(toFormData(draft)).unwrap();
      dispatch(
        applicationSubmitted({
          status: saved.status,
          rejection: saved.rejection,
          pinSetupRequired: saved.pinSetupRequired,
          displayName: draft.name.trim(),
        }),
      );
      if (saved.status === "approved") {
        const next = { ...draft, removeLogo: false, files: {} };
        setBaseline(next);
        setDraft(next);
      }
      setConfirming(false);
    } catch (caught) {
      setError(problemMessage(caught, "Could not save the profile"));
    }
  }

  if (profile.isError) return <Text>Could not load the profile</Text>;
  if (!draft || !baseline) return <Text>Loading your profile</Text>;
  const dirty = isDirty(baseline, draft);
  const review = needsReview(baseline, draft);
  return (
    <div className="mx-auto flex flex-col w-full ">
      <div className="flex flex-row gap-4">
        <div className="w-full flex flex-col gap-2">
          <BusinessCard
            draft={draft}
            phone={session?.account.phone ?? ""}
            documents={profile.data?.documents ?? []}
            onChange={patch}
          />
          <CategoriesCard draft={draft} onChange={patch} />
          <ExtraDetailsCard details={draft.extraDetails} onChange={patch} />
        </div>
        <div className="w-full flex flex-col gap-2">
          <TaxCard draft={draft} documents={profile.data?.documents ?? []} onChange={patch} />
          <InvoiceCard draft={draft} documents={profile.data?.documents ?? []} onChange={patch} />

        </div>
      </div>
      <SaveBar
        dirty={dirty}
        onDiscard={() => {
          setDraft(baseline);
          setConfirming(false);
          setError(null);
        }}
        onSave={() => {
          setError(null);
          setConfirming(true);
        }}
      />
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
    </div>
  );
}
