import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { problemMessage } from "@/features/authentication";
import { Box } from "@/components/ui/Box";
import { PageBar } from "@/components/ui/PageBar";
import { IconChat, IconMail } from "@/components/ui/Icon";
import { Stack } from "@/components/ui/Stack";
import { Text } from "@/components/ui/Text";
import { ChatDialog } from "../../components/ChatDialog";
import { ChatPanel } from "../../components/ChatPanel";
import { ContactCard } from "../../components/ContactCard";
import { FaqList } from "../../components/FaqList";
import { TicketDialog } from "../../components/TicketDialog";
import { TicketList } from "../../components/TicketList";
import { caseRows, caseTotal, type CasePage, type SupportCase } from "../../model";
import { useCasesQuery, useCreateCaseMutation, useFaqsQuery } from "../../support.api";
import { useSupportStream } from "../../useSupportStream";

export function SupportPage() {
  useSupportStream();
  const { caseId } = useParams();
  const navigate = useNavigate();
  const faqs = useFaqsQuery();
  const [page, setPage] = useState(1);
  const cases = useCasesQuery({ page, size: 25 });
  const packet = cases.data as CasePage | SupportCase[] | undefined;
  const tickets = caseRows(packet);
  const [createCase, createState] = useCreateCaseMutation();
  const [ticketOpen, setTicketOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null | undefined>(undefined);
  const failure = faqs.error ?? cases.error ?? createState.error;
  const items = faqs.data ?? [];
  const currentOpen = openId === undefined ? (items[0]?.id ?? null) : openId;

  async function submit(body: {
    kind: "ticket" | "chat";
    subject: string;
    category?: string;
    details?: string;
  }) {
    const created = await createCase(body).unwrap();
    setTicketOpen(false);
    setChatOpen(false);
    navigate(`/support/${created.id}`);
  }

  if (faqs.isLoading || cases.isLoading) {
    return <Text className="text-[13.5px] text-muted">Loading support</Text>;
  }

  return (
    <Stack className="mx-auto w-full gap-4">
      {failure ? (
        <Text className="text-[13.5px] font-bold text-rose">
          {problemMessage(failure, "Could not load support")}
        </Text>
      ) : null}
      <Box className="grid grid-cols-2 gap-4 max-[767px]:grid-cols-1">
        <ContactCard
          icon={<IconChat size={18} />}
          title="Live chat"
          detail="A support person joins the chat"
          action="Start chat"
          onClick={() => setChatOpen(true)}
        />
        <ContactCard
          icon={<IconMail size={18} />}
          title="Email us"
          detail="support@nammamedmate.com"
          action="Email"
          href="mailto:support@nammamedmate.com"
        />
      </Box>
      <Box className="grid grid-cols-[1.5fr_1fr] gap-4 max-[767px]:grid-cols-1">
        <FaqList
          items={items}
          openId={currentOpen}
          onToggle={(id) => setOpenId(currentOpen === id ? null : id)}
        />
        <Box>
          <TicketList
            items={tickets}
            onRaise={() => setTicketOpen(true)}
            onOpen={(id) => navigate(`/support/${id}`)}
          />
          <PageBar
            page={Array.isArray(packet) ? 1 : (packet?.page ?? page)}
            size={Array.isArray(packet) ? 25 : (packet?.size ?? 25)}
            total={caseTotal(packet)}
            onPage={setPage}
          />
        </Box>
      </Box>
      {ticketOpen ? (
        <TicketDialog
          onClose={() => setTicketOpen(false)}
          onSubmit={(subject, category, details) =>
            void submit({ kind: "ticket", subject, category, details })
          }
        />
      ) : null}
      {chatOpen ? (
        <ChatDialog
          onClose={() => setChatOpen(false)}
          onSubmit={(subject) => void submit({ kind: "chat", subject })}
        />
      ) : null}
      {caseId ? <ChatPanel caseId={caseId} onClose={() => navigate("/support")} /> : null}
    </Stack>
  );
}
