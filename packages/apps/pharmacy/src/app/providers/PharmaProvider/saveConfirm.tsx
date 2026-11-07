import { createContext, useContext } from "react";
import type { ConfirmPrompt } from "./confirmPrompt";

export type SavePrompt = ConfirmPrompt & {
  resolve: (accepted: boolean) => void;
};

export const SaveConfirmContext = createContext<{
  ask: (prompt: ConfirmPrompt) => Promise<boolean>;
} | null>(null);

export function useSaveConfirm() {
  const context = useContext(SaveConfirmContext);
  if (!context) throw new Error("Save confirmation is only available inside PharmaProvider");
  return context.ask;
}
