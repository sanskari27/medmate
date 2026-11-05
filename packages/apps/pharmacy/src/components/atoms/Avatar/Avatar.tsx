import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/className";

const avatarVariants = cva("grid place-items-center overflow-hidden rounded-full bg-wash font-bold text-mid", {
  variants: {
    size: {
      sm: "h-7 w-7 text-[11px]",
      md: "h-9 w-9 text-[13px]",
      lg: "h-14 w-14 text-[18px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export type AvatarProps = Omit<ComponentProps<"div">, "children"> &
  VariantProps<typeof avatarVariants> & {
    name: string;
    src?: string;
    alt?: string;
    initials?: string;
  };

export type AvatarSize = NonNullable<AvatarProps["size"]>;

function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + second).toUpperCase();
}

export function Avatar({ className, name, src, alt, size, initials, ...props }: AvatarProps) {
  if (src) {
    return (
      <img
        data-slot="avatar"
        src={src}
        alt={alt ?? name}
        className={cn(avatarVariants({ size }), "object-cover", className)}
      />
    );
  }
  return (
    <div data-slot="avatar" aria-hidden className={cn(avatarVariants({ size }), className)} {...props}>
      {initials ?? avatarInitials(name)}
    </div>
  );
}

export { avatarVariants };
