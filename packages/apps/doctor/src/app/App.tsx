import { Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui";
import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { signOut } from "@/features/auth";

export function App() {
  return (
    <main className="min-h-screen bg-surface-2 text-ink">
      <header className="flex items-center justify-between border-b border-line bg-surface px-6 py-3">
        <Text className="text-[13px] font-bold text-ink">Namma MedMate · Doctor</Text>
        <SignOutButton />
      </header>
      <div className="p-6">
        <Outlet />
      </div>
    </main>
  );
}

/** Signing out clears the session and sends the visitor back to sign-in. */
function SignOutButton() {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state) => state.auth.session);
  if (!session) return null;
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={() => {
        void dispatch(signOut());
      }}
    >
      Sign out
    </Button>
  );
}
