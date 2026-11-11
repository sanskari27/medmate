import type { ReactNode } from "react";
import { useDispatch } from "react-redux";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import {
  applicationSubmitted,
  problemMessage,
  useAuthActions,
  useAuthState,
} from "@/features/authentication";
import { ApplicationStatus } from "../components/ApplicationStatus";
import { AccountRestricted } from "../components/AccountRestricted";
import { SetupWizard } from "../components/SetupWizard";
import { useReadApplicationQuery, useSubmitApplicationMutation } from "../setup.api";

function SetupShell({ children, onSignOut }: { children: ReactNode; onSignOut: () => void }) {
  return (
    <Stack
      align="center"
      justify="center"
      className="fixed inset-0 z-[90] bg-[radial-gradient(60%_50%_at_50%_0%,rgba(143,212,168,0.18),transparent_60%),linear-gradient(135deg,#10301d,#0c2516)] p-6"
    >
      <Stack className="w-full max-w-[480px] gap-3 rounded-[20px] bg-paper p-6 shadow-pop">
        {children}
        <Button type="button" variant="ghost" onClick={onSignOut}>
          Log out
        </Button>
      </Stack>
    </Stack>
  );
}

export function SetupPage() {
  const { session } = useAuthState();
  const auth = useAuthActions();
  const dispatch = useDispatch();
  const application = useReadApplicationQuery();
  const [submitApplication] = useSubmitApplicationMutation();

  async function onSubmit(body: FormData) {
    try {
      const saved = await submitApplication(body).unwrap();
      const name = body.get("name");
      dispatch(
        applicationSubmitted({
          status: saved.status,
          rejection: saved.rejection,
          pinSetupRequired: saved.pinSetupRequired,
          displayName: typeof name === "string" ? name : null,
        }),
      );
      return null;
    } catch (error) {
      return problemMessage(error, "Could not submit the application");
    }
  }

  function signOut() {
    void auth.signOut();
  }

  if (!session) return null;
  if (application.isLoading) {
    return (
      <SetupShell onSignOut={signOut}>
        <Text>Loading your application</Text>
      </SetupShell>
    );
  }
  if (application.isError || !application.data) {
    return (
      <SetupShell onSignOut={signOut}>
        <Text>Could not load the application</Text>
      </SetupShell>
    );
  }
  return (
    <SetupWizard
      phone={session.account.phone}
      application={application.data}
      onSubmit={onSubmit}
      onSignOut={signOut}
    />
  );
}

export function ApplicationStatusPage() {
  const { session } = useAuthState();
  const auth = useAuthActions();
  return (
    <SetupShell onSignOut={() => void auth.signOut()}>
      <ApplicationStatus status={session?.account.verificationStatus ?? "pending_compliance"} />
    </SetupShell>
  );
}

export function AccountRestrictedPage() {
  const auth = useAuthActions();
  return (
    <SetupShell onSignOut={() => void auth.signOut()}>
      <AccountRestricted />
    </SetupShell>
  );
}
