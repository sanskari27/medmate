import { useEffect, useState } from "react";
import { Box, Button, Grid, Stack, Text } from "@/components/atoms";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { OnboardingCarousel, PinSetup } from "@/components/organisms/OnboardingCarousel";
import { SetupWizard } from "@/components/organisms/SetupWizard";
import { useAppDispatch, useAppSelector, usePharmacyNav } from "@/hooks";
import { AuthLayout } from "@/layouts/AuthLayout";
import MasterPortal from "@/screens/Master";
import { selectIsHospital } from "@/store/selectors/auth.selector";
import { loadMasterSession } from "@/store/thunks/master.thunk";
import { lockedRouteFallback } from "../../DashboardLayout.utils";
import { Canvas } from "../Canvas";

export function Inner() {
  const dispatch = useAppDispatch();
  const { route, go } = usePharmacyNav();
  const setupComplete = useAppSelector((state) => state.auth.setupComplete);
  const signedIn = useAppSelector((state) => state.auth.signedIn);
  const needsPin = useAppSelector((state) => state.auth.needsPin);
  const pinReset = useAppSelector((state) => state.auth.pinReset);
  const me = useAppSelector((state) => state.auth.me);
  const isHospital = useAppSelector(selectIsHospital);
  const masterSessionPhone = useAppSelector((state) => state.master.phone);
  const sessionLoaded = useAppSelector((state) => state.master.sessionLoaded);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [masterPortalOpen, setMasterPortalOpen] = useState(false);

  function closeSidebar() {
    setSidebarOpen(false);
  }
  function toggleSidebar() {
    setSidebarOpen(function flip(open) {
      return !open;
    });
  }
  function openMasterPortal() {
    setMasterPortalOpen(true);
  }
  function closeMasterPortal() {
    setMasterPortalOpen(false);
  }
  function leaveMasterPortal() {
    setMasterPortalOpen(false);
  }
  function openMasterFromOnboarding() {
    setMasterPortalOpen(true);
    void dispatch(loadMasterSession());
  }

  useEffect(
    function loadMasterOnMount() {
      void dispatch(loadMasterSession());
    },
    [dispatch],
  );
  useEffect(
    function redirectLockedRoute() {
      if (!me) return;
      const next = lockedRouteFallback(route, {
        role: me.role,
        permissions: me.permissions,
        isHospital,
      });
      if (next) go(next);
    },
    [me, route, isHospital, go],
  );

  if (!sessionLoaded && !signedIn) {
    return <Text>Loading pharmacy…</Text>;
  }
  if (masterSessionPhone && (masterPortalOpen || !signedIn)) {
    return (
      <MasterPortal
        phone={masterSessionPhone}
        pharmacyLabel={signedIn ? "Pharmacy" : "Pharmacy sign in"}
        onPharmacy={closeMasterPortal}
        onSignedOut={leaveMasterPortal}
      />
    );
  }
  if (!signedIn) {
    return (
      <AuthLayout>
        <OnboardingCarousel onMaster={openMasterFromOnboarding} />
      </AuthLayout>
    );
  }
  if (needsPin || pinReset) {
    return (
      <AuthLayout>
        <PinSetup />
      </AuthLayout>
    );
  }
  if (!setupComplete) {
    return (
      <AuthLayout>
        <SetupWizard />
      </AuthLayout>
    );
  }
  return (
    <Stack className="relative h-dvh overflow-hidden bg-canvas">
      {sidebarOpen ? <MenuBackdrop onClose={closeSidebar} /> : null}
      <Grid
        columns={1}
        className="h-dvh grid-cols-1 gap-0 overflow-hidden min-[1100px]:grid-cols-[248px_minmax(0,1fr)]"
      >
        <AppSidebar
          open={sidebarOpen}
          onNavigate={closeSidebar}
          onMaster={masterSessionPhone ? openMasterPortal : undefined}
        />
        <Stack className="h-dvh min-w-0">
          <AppHeader onMenu={toggleSidebar} />
          <Box className="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 pt-3.5 pb-[max(28px,env(safe-area-inset-bottom))] min-[768px]:px-4 min-[768px]:pt-[18px] min-[768px]:pb-9 min-[1100px]:px-6 min-[1100px]:pt-[22px] min-[1100px]:pb-10">
            <Canvas />
          </Box>
        </Stack>
      </Grid>
    </Stack>
  );
}

function MenuBackdrop({ onClose }: { onClose: () => void }) {
  return (
    <Button
      variant="ghost"
      aria-label="Close menu"
      className="fixed inset-0 z-30 h-full w-full rounded-none border-0 bg-black/45 p-0 shadow-none hover:border-0 hover:bg-black/45 hover:text-transparent focus-visible:shadow-none active:translate-y-0 min-[1100px]:hidden"
      onClick={onClose}
    />
  );
}
