import type { ReactNode } from "react";

type IconProps = { size?: number };

function Svg({
  size = 18,
  children,
  className,
}: IconProps & { children: ReactNode; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconBox({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </Svg>
  );
}

export function IconUpload({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M12 16V5" />
      <path d="m7 9 5-5 5 5" />
      <path d="M5 19h14" />
    </Svg>
  );
}

export function IconRupee({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M7 5h10" />
      <path d="M7 9h10" />
      <path d="M7 5a5 5 0 0 1 0 8H7l8 6" />
    </Svg>
  );
}

export function IconKiosk({ size }: IconProps) {
  return (
    <Svg size={size}>
      <rect x="6" y="3" width="12" height="14" rx="1.5" />
      <path d="M9 21h6M12 17v4" />
    </Svg>
  );
}

export function IconInventory({ size }: IconProps) {
  return (
    <Svg size={size}>
      <path d="M4 7h16v12H4Z" />
      <path d="M8 7V5h8v2M4 12h16" />
    </Svg>
  );
}

export function IconSparkle({ size }: IconProps) {
  return (
    <Svg size={size} className="inline-block mb-1">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2 2M16 16l2 2M18 6l-2 2M8 16l-2 2" />
    </Svg>
  );
}

export function IconBulb({ size }: IconProps) {
  return (
    <Svg size={size} className="inline-block mb-1">
      <path d="M9 18h6M10 21h4" />
      <path d="M8 14a5 5 0 1 1 8 0c-.8.8-1.5 1.6-1.7 2.6H9.7C9.5 15.6 8.8 14.8 8 14Z" />
    </Svg>
  );
}
