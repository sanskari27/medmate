import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { problemMessage, useAuthState } from "@/features/authentication";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";
import { statusLabel } from "../../model";
import {
  useCaseDetailQuery,
  useResolveCaseMutation,
  useSendMessageMutation,
} from "../../support.api";

export function ChatPanel({ caseId, onClose }: { caseId: string; onClose: () => void }) {
  const accountId = useAuthState().session?.account.id;
  const detail = useCaseDetailQuery(caseId, { skip: !caseId });
  const [sendMessage, sendState] = useSendMessageMutation();
  const [resolveCase, resolveState] = useResolveCaseMutation();
  const [text, setText] = useState("");
  const [shown, setShown] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const item = detail.data;
  const failure = detail.error ?? sendState.error ?? resolveState.error;
  const resolved = item?.status === "resolved";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [item?.messages]);

  async function send() {
    const body = text.trim();
    if (!body || !item) return;
    await sendMessage({ id: item.id, text: body }).unwrap();
    setText("");
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        aria-label="Close chat"
        className="absolute inset-0 bg-[rgba(13,32,21,0.35)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label={item?.subject ?? "Chat"}
        className={cn(
          "relative flex h-full w-full max-w-[400px] flex-col bg-paper shadow-[-12px_0_40px_rgba(13,32,21,0.18)] transition-transform duration-200 ease-out",
          shown ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-start gap-3 border-b border-line px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mid text-[15px] font-bold text-white">
            {(item?.subject ?? "C").slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1">
            <Text className="truncate text-[15px] font-bold text-ink">
              {item?.subject ?? "Chat"}
            </Text>
            {item ? (
              <Text className="truncate text-[12px] text-muted">
                {item.ticketNumber} · {item.category} · {statusLabel(item.status)}
              </Text>
            ) : null}
            {item?.status === "waiting" ? (
              <Text className="text-[12px] text-muted">Waiting for support</Text>
            ) : null}
            {item?.assigneeName ? (
              <Text className="text-[12px] text-muted">Picked up by {item.assigneeName}</Text>
            ) : null}
          </span>
          <Button variant="ghost" aria-label="Close" onClick={onClose}>
            ×
          </Button>
        </header>
        <div
          ref={scroller}
          className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto bg-canvas px-4 py-4"
        >
          {detail.isLoading ? (
            <Text className="text-[13.5px] text-muted">Loading support</Text>
          ) : null}
          {!detail.isLoading && !item ? (
            <Text className="text-[13.5px] font-bold text-rose">
              {problemMessage(failure, "Could not load this chat")}
            </Text>
          ) : null}
          {(item?.messages ?? []).map((message) => {
            const mine = message.authorId === accountId;
            return (
              <div
                key={message.id}
                className={cn("flex max-w-[85%] flex-col", mine ? "self-end" : "self-start")}
              >
                <Text
                  className={cn(
                    "mb-1 text-[11px] font-bold",
                    mine ? "text-right text-mid" : "text-ink-2",
                  )}
                >
                  {message.authorName || "Support"}
                </Text>
                <div
                  className={cn(
                    "px-3 py-2 text-[13.5px] leading-snug",
                    mine
                      ? "rounded-[18px] rounded-br-[4px] bg-mid text-white"
                      : "rounded-[18px] rounded-bl-[4px] bg-paper text-ink shadow-sm",
                  )}
                >
                  {message.body}
                </div>
              </div>
            );
          })}
          {failure && item ? (
            <Text className="text-[13px] font-bold text-rose">
              {problemMessage(failure, "Could not update this chat")}
            </Text>
          ) : null}
        </div>
        {item && !resolved ? (
          <footer className="border-t border-line bg-paper px-3 py-3">
            <div className="flex items-end gap-2">
              <textarea
                aria-label="Message"
                placeholder="Write a message"
                value={text}
                rows={1}
                onChange={(event) => setText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void send();
                  }
                }}
                className="max-h-28 min-h-10 flex-1 resize-none rounded-full border border-line-2 bg-canvas px-4 py-2.5 text-[13.5px] text-ink"
              />
              <Button className="rounded-full" disabled={!text.trim()} onClick={() => void send()}>
                Send
              </Button>
            </div>
            <div className="mt-2 flex ">
              <Button
                variant="ghost"
                size="md"
                className="w-full"
                onClick={() => void resolveCase(item.id)}
              >
                Mark resolved
              </Button>
            </div>
          </footer>
        ) : null}
      </aside>
    </div>,
    document.body,
  );
}
