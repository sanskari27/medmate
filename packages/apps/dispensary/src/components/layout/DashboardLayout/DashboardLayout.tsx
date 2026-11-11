import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Stack } from "@/components/ui/Stack";
import { Header } from "../Header";
import { Sidebar, type NavEntry } from "../Sidebar";

export function DashboardLayout({
  items,
  displayName,
  roleLabel,
  onSignOut,
}: {
  items: NavEntry[];
  displayName: string;
  roleLabel: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const current = items.find((item) => item.path === location.pathname) ?? items[0];
  if (!current) return null;

  function navigateTo(path: string) {
    navigate(path);
    setOpen(false);
  }

  return (
    <Stack className="relative h-dvh overflow-hidden bg-canvas">
      {open ? (
        <Button
          variant="ghost"
          aria-label="Close menu"
          className="fixed inset-0 z-30 h-full w-full rounded-none border-0 bg-black/45 p-0 shadow-none hover:border-0 hover:bg-black/45 hover:text-transparent focus-visible:shadow-none active:translate-y-0 min-[1100px]:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}
      <div className="grid h-dvh grid-cols-1 gap-0 overflow-hidden min-[1100px]:grid-cols-[248px_minmax(0,1fr)]">
        <Sidebar
          items={items}
          currentPath={location.pathname}
          open={open}
          displayName={displayName}
          roleLabel={roleLabel}
          onNavigate={navigateTo}
          onSignOut={onSignOut}
        />
        <Stack className="h-dvh min-w-0">
          <Header
            title={current.title}
            sub={current.sub}
            onMenu={() => setOpen((value) => !value)}
          />
          <Box className="min-h-0 flex-1 overflow-y-auto bg-canvas px-3 pt-3.5 pb-[max(28px,env(safe-area-inset-bottom))] min-[768px]:px-4 min-[768px]:pt-[18px] min-[768px]:pb-9 min-[1100px]:px-6 min-[1100px]:pt-[22px] min-[1100px]:pb-10">
            <Outlet />
          </Box>
        </Stack>
      </div>
    </Stack>
  );
}
