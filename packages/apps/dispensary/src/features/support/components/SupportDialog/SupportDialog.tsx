import type { ReactNode } from "react";
import { Box } from "@/components/ui/Box";
import { Button } from "@/components/ui/Button";
import { Heading } from "@/components/ui/Heading";

export function SupportDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Box
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px]"
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-label={title}
        className="flex max-h-[90vh] w-full max-w-[540px] flex-col overflow-hidden rounded-lg bg-paper shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <Box className="flex items-center justify-between border-b border-line px-5 py-4">
          <Heading level={3}>{title}</Heading>
          <Button variant="ghost" aria-label="Close" onClick={onClose}>
            ×
          </Button>
        </Box>
        <Box className="grid gap-3.5 overflow-y-auto p-5">{children}</Box>
      </Box>
    </Box>
  );
}
