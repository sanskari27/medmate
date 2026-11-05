import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

const modalVariants = cva("flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-paper shadow-pop", {
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
});

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
        "fixed inset-0 z-[100] flex items-center justify-center bg-[#0d201580] p-6 backdrop-blur-[3px]",
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
        <Stack direction="row" align="center" justify="between" className="border-b border-line px-5 py-4">
          <Heading level={3} className="text-[17px]">
            {title}
          </Heading>
          <IconButton label="Close" variant="close" onClick={onClose}>
            ×
          </IconButton>
        </Stack>
        <Box className="overflow-y-auto p-5">{children}</Box>
        {footer ? (
          <Stack direction="row" justify="end" className="gap-2.5 border-t border-line px-5 py-3.5">
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
