import { createContext, useContext } from "react";

export type SavePrompt = {
  title: string;
  body: string;
  resolve: (accepted: boolean) => void;
};

export const SaveConfirmContext = createContext<{
  ask: (kind: "save" | "edit", copy?: { title: string; body: string }) => Promise<boolean>;
} | null>(null);

export function useSaveConfirm() {
  const context = useContext(SaveConfirmContext);
  if (!context) throw new Error("Save confirmation is only available inside PharmaProvider");
  return context.ask;
}
