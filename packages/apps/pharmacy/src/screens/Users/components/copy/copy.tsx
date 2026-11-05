import { useState } from "react";
import { IconCopy, IconCheck } from "@/components/Icon";

export function copy(text: string, done: () => void) {
  navigator.clipboard?.writeText(text).then(done, done);
}

export function Copy({ text, label }: { text: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      className="pd-copybtn"
      title={`Copy ${label || ""}`}
      onClick={() =>
        copy(text, () => {
          setOk(true);
          setTimeout(() => setOk(false), 1400);
        })
      }
    >
      {ok ? <IconCheck size={13} /> : <IconCopy size={13} />}
    </button>
  );
}
