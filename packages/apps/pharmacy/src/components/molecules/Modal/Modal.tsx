import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Heading } from "@/components/atoms/Heading";
import { IconButton } from "@/components/atoms/IconButton";
import { Stack } from "@/components/atoms/Stack";
import { cn } from "@/utils/className";

const modalVariants = cva("w-full rounded-lg bg-paper shadow-pop", {
  variants: {
    size: {
      sm: "max-w-sm",
      md: "max-w-lg",
      lg: "max-w-3xl",
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
      className={cn("fixed inset-0 z-50 grid place-items-center bg-deep/40 p-4", overlayClassName)}
      onClick={onClose}
    >
      <Box
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(modalVariants({ size: resolvedSize }), className)}
        onClick={stopModalClose}
      >
        <Stack direction="row" align="center" justify="between" className="border-b border-line px-4 py-3">
          <Heading level={3}>{title}</Heading>
          <IconButton label="Close" variant="close" onClick={onClose}>
            ×
          </IconButton>
        </Stack>
        <Box className="px-4 py-4">{children}</Box>
        {footer ? (
          <Stack direction="row" justify="end" gap={2} className="border-t border-line px-4 py-3">
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
