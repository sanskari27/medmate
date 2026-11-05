import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps, ReactNode } from "react";
import { Box } from "@/components/atoms/Box";
import { Button } from "@/components/atoms/Button";
import { IconLock } from "@/components/atoms/Icon";
import { Text } from "@/components/atoms/Text";
import { cn } from "@/utils/className";

const navItemVariants = cva(
  "relative h-auto w-full justify-start gap-[11px] rounded-sm border-0 bg-transparent px-3 py-2 text-left text-[13px] font-semibold text-[#ffffffa8] shadow-none transition-[background-color,color] duration-[140ms] hover:bg-[#ffffff12] hover:text-white active:translate-y-0 max-[767px]:min-h-11",
  {
    variants: {
      active: {
        true: "bg-[#ffffff1a] font-bold text-white before:absolute before:top-1/2 before:-left-3 before:h-[18px] before:w-[3px] before:-translate-y-1/2 before:rounded-r-[3px] before:bg-mint before:content-['']",
        false: "",
      },
      locked: {
        true: "opacity-[0.58] hover:bg-[#ffffff0d] hover:opacity-[0.85]",
        false: "",
      },
    },
    defaultVariants: {
      active: false,
      locked: false,
    },
  },
);

export type NavItemProps = Omit<ComponentProps<typeof Button>, "children"> &
  VariantProps<typeof navItemVariants> & {
    icon?: ReactNode;
    badge?: number;
    children: ReactNode;
  };

function NavBadge({ count, active }: { count: number; active: boolean }) {
  return (
    <Text
      as="span"
      className={cn(
        "ml-auto grid h-[19px] min-w-[19px] place-items-center rounded-[10px] bg-gold px-[5px] text-[11px] font-extrabold text-deep",
        active && "bg-white text-dark",
      )}
    >
      {count}
    </Text>
  );
}

export function NavItem({
  className,
  active = false,
  locked = false,
  icon,
  badge,
  title,
  children,
  type = "button",
  ...props
}: NavItemProps) {
  const showBadge = !locked && badge != null && badge > 0;
  return (
    <Button
      data-slot="nav-item"
      type={type}
      variant="ghost"
      aria-current={active ? "page" : undefined}
      title={locked ? "Premium feature — upgrade to unlock" : title}
      className={cn(navItemVariants({ active, locked }), className)}
      {...props}
    >
      {icon ? (
        <Box
          className={cn(
            "grid h-5 w-5 shrink-0 place-items-center",
            active ? "opacity-100" : "opacity-80",
          )}
        >
          {icon}
        </Box>
      ) : null}
      {children}
      {locked ? (
        <Box className="ml-auto text-gold">
          <IconLock size={12} />
        </Box>
      ) : null}
      {showBadge && badge != null ? <NavBadge count={badge} active={Boolean(active)} /> : null}
    </Button>
  );
}

export { navItemVariants };
