import { usePharma } from "@/app/session/pharmacy-provider";

export function Toast() {
  const { toastMsg } = usePharma();
  return (
    <div className={`pd-toast${toastMsg ? " show" : ""}`} role="status">
      {toastMsg}
    </div>
  );
}
