import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { SaveConfirm, SignOutDialog } from "@/layouts/AuthLayout/components/SignOutDialog";
import { clearToast, setLeaveOpen, stampNow } from "@/store/actions/feedback.actions";
import { bindRouter } from "@/store/middleware/router.middleware";
import { loadSession, signOutRequest } from "@/store/thunks/auth.thunk";
import { resetRoute } from "@/store/actions/feedback.actions";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { SaveConfirmContext } from "./saveConfirm";

export function PharmaProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const signedIn = useAppSelector((state) => state.auth.signedIn);
  const quietRefresh = useAppSelector((state) => state.ui.quietRefresh);
  const toastMsg = useAppSelector((state) => state.ui.toastMsg);
  const leaveOpen = useAppSelector((state) => state.ui.leaveOpen);
  const [saveAsk, setSaveAsk] = useState<{
    title: string;
    body: string;
    resolve: (accepted: boolean) => void;
  } | null>(null);
  const signedInRef = useRef(signedIn);
  const quietRef = useRef(quietRefresh);
  signedInRef.current = signedIn;
  quietRef.current = quietRefresh;

  const ask = useCallback(
    (kind: "save" | "edit", copy?: { title: string; body: string }) =>
      new Promise<boolean>((resolve) => {
        setSaveAsk({
          title: copy?.title ?? (kind === "edit" ? "Save these changes?" : "Save this?"),
          body: copy?.body ?? "Nothing already stored will be deleted.",
          resolve,
        });
      }),
    [],
  );

  useEffect(() => {
    dispatch(stampNow(Date.now()));
    bindRouter(navigate);
  }, [dispatch, navigate]);

  useEffect(() => {
    void dispatch(loadSession());
    let hidden = document.visibilityState === "hidden";
    const onVisibility = () => {
      const isHidden = document.visibilityState === "hidden";
      if (hidden && !isHidden && signedInRef.current && !quietRef.current)
        void dispatch(loadSession());
      hidden = isHidden;
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [dispatch]);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = window.setTimeout(() => dispatch(clearToast()), 1800);
    return () => window.clearTimeout(timer);
  }, [dispatch, toastMsg]);

  function finishSignOut() {
    dispatch(setLeaveOpen(false));
    void dispatch(signOutRequest()).then(() => {
      dispatch(resetRoute("dashboard"));
    });
  }

  if (!hydrated) return <div>Loading pharmacy…</div>;

  return (
    <SaveConfirmContext.Provider value={{ ask }}>
      {children}
      {leaveOpen && (
        <SignOutDialog onCancel={() => dispatch(setLeaveOpen(false))} onConfirm={finishSignOut} />
      )}
      {saveAsk && (
        <SaveConfirm
          title={saveAsk.title}
          body={saveAsk.body}
          onCancel={() => {
            saveAsk.resolve(false);
            setSaveAsk(null);
          }}
          onConfirm={() => {
            saveAsk.resolve(true);
            setSaveAsk(null);
          }}
        />
      )}
    </SaveConfirmContext.Provider>
  );
}
