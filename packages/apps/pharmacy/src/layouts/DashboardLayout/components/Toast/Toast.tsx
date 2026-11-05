import { usePharma } from "@/hooks";

export function Toast() {
  const { toastMsg } = usePharma();
  return (
    <div className={`pd-toast${toastMsg ? " show" : ""}`} role="status">
      {toastMsg}
    </div>
  );
}
