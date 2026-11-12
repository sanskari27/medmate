import { useEffect, useState } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";
import { IconPrint } from "@/components/ui/Icon";
import { cn } from "@/utils/className";
import type { InvoiceDraft, InvoiceFile, InvoicePharmacy } from "../../model";
import { InvoicePaper } from "../InvoicePaper";

export function InvoicePreview({
  draft,
  logo,
  signature,
  pharmacy,
}: {
  draft: InvoiceDraft;
  logo: InvoiceFile | null;
  signature: InvoiceFile | null;
  pharmacy: InvoicePharmacy;
}) {
  const logoUrl = useObjectUrl(draft.logoFile) ?? logo?.url ?? null;
  const stampUrl = useObjectUrl(draft.signatureFile) ?? signature?.url ?? null;
  const thermal = draft.template === "thermal";
  const paper = (
    <InvoicePaper
      template={draft.template}
      accent={draft.accent}
      title={draft.title}
      prefix={draft.prefix}
      signatory={draft.signatory}
      bankLine={draft.bankLine}
      showBank={draft.showBank}
      terms={draft.terms}
      showLogo={draft.showLogo}
      showStamp={draft.showStamp}
      logoUrl={logoUrl}
      stampUrl={stampUrl}
      pharmacy={pharmacy}
      className={thermal ? "print-area" : "invoice-a4-fit print-area"}
    />
  );
  return (
    <Box className="sticky top-4 flex min-w-0 flex-col rounded-md border border-line bg-paper shadow-sm">
      <Box className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-[18px] py-[15px]">
        <Heading level={3} className="text-[15px]">
          Live preview
        </Heading>
        <Button type="button" size="sm" onClick={() => window.print()}>
          <IconPrint size={14} /> Print sample
        </Button>
      </Box>
      <Box className="bg-wash-2 p-[18px]">
        <Box
          className={cn(
            "overflow-x-auto rounded-[10px] bg-paper p-5 shadow-sm",
            thermal &&
              "bg-[repeating-linear-gradient(#fff,#fff_22px,#fafafa_22px,#fafafa_23px)] p-[18px]",
          )}
        >
          {thermal ? (
            paper
          ) : (
            <Box className="invoice-a4-frame">
              <Box className="invoice-a4-sizer">{paper}</Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function useObjectUrl(file?: File) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== "function") {
      setUrl(undefined);
      return;
    }
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url;
}
