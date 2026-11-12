import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { canHandleSupportCases, useAuthState } from "@/features/authentication";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { statusLabel } from "../../model";
import { problemMessage } from "../../problemMessage";
import {
  useCaseDetailQuery,
  useClaimCaseMutation,
  useResolveCaseMutation,
  useSendMessageMutation,
} from "../../support.api";
import { useSupportStream } from "../../useSupportStream";

export function SupportCasePage() {
  useSupportStream();
  const { caseId = "" } = useParams();
  const account = useAuthState().session?.account;
  const handler = canHandleSupportCases(account);
  const detail = useCaseDetailQuery(caseId, { skip: !caseId });
  const [claim] = useClaimCaseMutation();
  const [sendMessage, sendState] = useSendMessageMutation();
  const [resolveCase] = useResolveCaseMutation();
  const [text, setText] = useState("");
  const item = detail.data;
  const failure = detail.error ?? sendState.error;
  const resolved = item?.status === "resolved";

  async function send() {
    const body = text.trim();
    if (!body || !item) return;
    await sendMessage({ id: item.id, text: body }).unwrap();
    setText("");
  }

  if (detail.isLoading) return <Text className="text-[13.5px] text-muted">Loading support</Text>;
  if (!item) {
    return (
      <Text className="text-[13.5px] font-bold text-rose">
        {problemMessage(failure, "Could not load this case")}
      </Text>
    );
  }

  return (
    <Stack className="mx-auto w-full max-w-[760px] gap-4">
      <Link to="/support" className="text-[13px] font-bold text-mid">
        All cases
      </Link>
      <Box className="rounded-md border border-line bg-paper p-5">
        <Heading level={3}>{item.subject}</Heading>
        <Text className="mt-1 text-[12.5px] text-muted">
          {item.ticketNumber} · {item.pharmacyName || "Pharmacy"} · {item.category} ·{" "}
          {statusLabel(item.status)} · {item.assigneeName || "Unassigned"}
        </Text>
        {failure ? (
          <Text className="mt-3 text-[13.5px] font-bold text-rose">
            {problemMessage(failure, "Could not update this case")}
          </Text>
        ) : null}
        <Stack className="mt-4 gap-3">
          {(item.messages ?? []).map((message) => (
            <Box key={message.id} className="rounded-sm bg-wash px-3 py-2">
              <Text className="text-[12px] font-bold text-ink-2">
                {message.authorName || "Support"}
              </Text>
              <Text className="text-[13.5px] text-ink">{message.body}</Text>
            </Box>
          ))}
        </Stack>
        {handler && item.status === "waiting" ? (
          <Button className="mt-4" onClick={() => void claim(item.id)}>
            Pick up
          </Button>
        ) : null}
        {handler && !resolved ? (
          <Stack className="mt-4 gap-2">
            <textarea
              aria-label="Message"
              placeholder="Write a message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              className="min-h-16 w-full resize-y rounded-sm border border-line-2 bg-paper px-3 py-[9px] text-[13.5px] text-ink"
            />
            <Box className="flex justify-end gap-2.5">
              <Button variant="ghost" onClick={() => void resolveCase(item.id)}>
                Mark resolved
              </Button>
              <Button disabled={!text.trim()} onClick={() => void send()}>
                Send
              </Button>
            </Box>
          </Stack>
        ) : null}
      </Box>
    </Stack>
  );
}
