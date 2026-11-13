import { useLayoutEffect, useRef, type ReactNode } from "react";
import { Text } from "@/components/ui/Text";
import { cn } from "@/utils/className";

const MIN_PX = 12;

export type FitTextProps = {
  children: ReactNode;
  className?: string;
  title?: string;
};

export function FitText({ children, className, title }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const label =
    title ??
    (typeof children === "string" || typeof children === "number" ? String(children) : undefined);

  useLayoutEffect(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const fit = () => {
      el.style.fontSize = "";
      const max = Number.parseFloat(getComputedStyle(el).fontSize);
      if (!Number.isFinite(max) || el.clientWidth === 0) return;
      let size = max;
      el.style.fontSize = `${size}px`;
      while (el.scrollWidth > el.clientWidth + 1 && size > MIN_PX) {
        size -= 1;
        el.style.fontSize = `${size}px`;
      }
      if (size === max) el.style.fontSize = "";
    };

    fit();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(fit);
    observer.observe(parent);
    let alive = true;
    void document.fonts?.ready.then(() => {
      if (alive) fit();
    });
    return () => {
      alive = false;
      observer.disconnect();
    };
  }, [children, className]);

  return (
    <span
      ref={ref}
      title={label}
      className={cn(
        "block w-full min-w-0 overflow-hidden text-ellipsis whitespace-nowrap tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CardLine({ children, className }: { children: string; className?: string }) {
  if (children.includes("₹")) return <FitText className={className}>{children}</FitText>;
  return <Text className={cn("break-words", className)}>{children}</Text>;
}
