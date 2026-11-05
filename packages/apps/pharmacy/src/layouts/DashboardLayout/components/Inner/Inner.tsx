import { useEffect, useState } from "react";
import { Box, Button, Grid, Stack, Text } from "@/components/atoms";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AppSidebar } from "@/components/organisms/AppSidebar";
import { OnboardingCarousel, PinSetup } from "@/components/organisms/OnboardingCarousel";
import { SetupWizard } from "@/components/organisms/SetupWizard";
import { usePharma } from "@/hooks";
import { AuthLayout } from "@/layouts/AuthLayout";
import MasterPortal from "@/screens/Master";
import { api } from "@/services/api/apiClient";
import { lockedRouteFallback } from "../../DashboardLayout.utils";
import { Canvas } from "../Canvas";

export function Inner() {
  const { setupComplete, signedIn, needsPin, pinReset, route, go, me, isHospital } = usePharma();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [masterSessionPhone, setMasterSessionPhone] = useState<string | null | undefined>(undefined);
  const [masterPortalOpen, setMasterPortalOpen] = useState(false);

  function loadMasterSession() {
    api<{ phone: string }>("/master/session")
      .then(function storeMasterPhone(row) {
        setMasterSessionPhone(row.phone);
      })
      .catch(function clearMasterPhone() {
        setMasterSessionPhone(null);
      });
  }
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
    setMasterSessionPhone(null);
    setMasterPortalOpen(false);
  }
  function openMasterFromOnboarding() {
    setMasterPortalOpen(true);
    void loadMasterSession();
  }

  useEffect(function loadMasterOnMount() {
    void loadMasterSession();
  }, []);
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

  if (masterSessionPhone === undefined && !signedIn) {
    return (
      <Stack align="center" justify="center" className="h-dvh bg-canvas">
        <Text>Loading pharmacy…</Text>
      </Stack>
    );
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
        className="h-dvh grid-cols-1 gap-0 overflow-hidden min-[1100px]:grid-cols-[16rem_minmax(0,1fr)]"
      >
        <AppSidebar
          open={sidebarOpen}
          onNavigate={closeSidebar}
          onMaster={masterSessionPhone ? openMasterPortal : undefined}
        />
        <Stack className="h-dvh min-w-0">
          <AppHeader onMenu={toggleSidebar} />
          <Box className="min-h-0 flex-1 overflow-y-auto bg-canvas px-4 py-5 lg:px-6">
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
      className="fixed inset-0 z-30 h-full w-full rounded-none border-0 bg-deep/45 p-0 min-[1100px]:hidden"
      onClick={onClose}
    />
  );
}
