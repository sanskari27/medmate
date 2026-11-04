import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DemoForm } from "@/features/leads/demo-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type DemoDialogContextValue = {
  open: boolean;
  openDemo: () => void;
  closeDemo: () => void;
  setOpen: (open: boolean) => void;
};

const DemoDialogContext = createContext<DemoDialogContextValue | null>(null);

export function DemoDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openDemo = useCallback(() => setOpen(true), []);
  const closeDemo = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ open, openDemo, closeDemo, setOpen }),
    [open, openDemo, closeDemo],
  );
  return (
    <DemoDialogContext.Provider value={value}>
      {children}
    </DemoDialogContext.Provider>
  );
}

export function useDemoDialog() {
  const ctx = useContext(DemoDialogContext);
  if (!ctx) {
    throw new Error("useDemoDialog must be used within DemoDialogProvider");
  }
  return ctx;
}

export function DemoDialog() {
  const { open, setOpen } = useDemoDialog();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg" data-testid="demo-dialog">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            Book a free demo
          </DialogTitle>
          <DialogDescription>
            A short walkthrough of the pharmacy console and neighbourhood
            network. We will map your shop, stock, and billing needs.
          </DialogDescription>
        </DialogHeader>
        <DemoForm
          idPrefix="dialog-demo"
          onSubmitted={() => {
            /* keep open to show success */
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
