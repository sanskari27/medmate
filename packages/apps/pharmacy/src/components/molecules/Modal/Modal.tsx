import { cva, type VariantProps } from "class-variance-authority";
import type { ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

const modalVariants = cva(
  "flex max-h-[90vh] w-full animate-[pd-pop_0.2s_cubic-bezier(0.2,0.9,0.3,1.2)] flex-col overflow-hidden rounded-lg bg-paper shadow-pop motion-reduce:animate-none max-[767px]:max-h-[92dvh] max-[767px]:max-w-none max-[767px]:rounded-t-lg max-[767px]:rounded-b-none",
  {
    variants: {
      size: {
        sm: "max-w-sm",
        md: "max-w-[540px]",
        lg: "max-w-[720px]",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

export type ModalProps = VariantProps<typeof modalVariants> & {
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  /** @deprecated Use size="lg". */
  wide?: boolean;
  className?: string;
  overlayClassName?: string;
};

export function Modal({
  title,
  children,
  footer,
  onClose,
  wide = false,
  size,
  className,
  overlayClassName,
}: ModalProps) {
  const resolvedSize = size ?? (wide ? "lg" : "md");
  return (
    <Box
      data-slot="modal-overlay"
      className={cn(
        "fixed inset-0 z-[100] flex animate-[pd-fade_0.16s_ease] items-center justify-center bg-[rgba(13,32,21,0.5)] p-6 backdrop-blur-[3px] motion-reduce:animate-none max-[767px]:items-end max-[767px]:p-0",
        overlayClassName,
      )}
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(modalVariants({ size: resolvedSize }), className)}
        onClick={stopModalClose}
      >
        <Stack
          direction="row"
          align="center"
          justify="between"
          className="border-b border-line px-5 py-4"
        >
          <Heading level={3} className="text-[17px]">
            {title}
          </Heading>
          <IconButton
            label="Close"
            variant="close"
            onClick={onClose}
            className="h-8 w-8 rounded-sm bg-wash-2 text-[18px] leading-none text-ink-2 hover:bg-wash hover:text-ink-2"
          >
            ×
          </IconButton>
        </Stack>
        <Box className="overflow-y-auto p-5">{children}</Box>
        {footer ? (
          <Stack
            direction="row"
            justify="end"
            className="gap-2.5 border-t border-line px-5 py-3.5 max-[767px]:flex-wrap max-[767px]:[&_button]:min-w-0 max-[767px]:[&_button]:flex-1"
          >
            {footer}
          </Stack>
        ) : null}
      </Box>
    </Box>
  );
}

function stopModalClose(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

export { modalVariants };
