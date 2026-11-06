import { useCallback } from "react";
import type { AsyncThunkAction } from "@reduxjs/toolkit";
import { useSaveConfirm } from "@/app/providers/PharmaProvider/saveConfirm";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import type { SaveFault } from "@/utils";
import { faultOf } from "@/utils/validation";

type ConfirmOptions = {
  quiet?: boolean;
  confirmed?: boolean;
  kind?: "save" | "edit";
  copy?: { title: string; body: string };
};

export function useConfirmedDispatch() {
  const dispatch = useAppDispatch();
  const ask = useSaveConfirm();
  return useCallback(
    async function confirmDispatch<Result>(
      action: AsyncThunkAction<Result, any, any>,
      options?: ConfirmOptions,
    ): Promise<{ data: Result } | { fault: SaveFault }> {
      if (!options?.quiet && !options?.confirmed) {
        const accepted = await ask(options?.kind ?? "save", options?.copy);
        if (!accepted) return { fault: { message: "Save cancelled" } };
      }
      try {
        const data = await dispatch(action).unwrap();
        return { data };
      } catch (error: unknown) {
        const message = typeof error === "string" ? error : faultOf(error).message;
        return { fault: faultOf(new Error(message)) };
      }
    },
    [ask, dispatch],
  );
}

export function faultFrom<T>(result: { data: T } | { fault: SaveFault }): SaveFault | null {
  return "fault" in result ? result.fault : null;
}
