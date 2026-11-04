type AboutValueIconProps = {
  icon: 'location' | 'shield' | 'check' | 'heart';
};

export function AboutValueIcon({ icon }: AboutValueIconProps) {
  const paths = {
    location: (
      <>
        <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3l7 3v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    check: <path d="M20 6 9 17l-5-5" />,
    heart: (
      <path d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" />
    ),
  } as const;

  return (
    <svg fill="none" viewBox="0 0 24 24">
      <g
        stroke="currentColor"
        strokeWidth={icon === 'check' ? '2.6' : '2'}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[icon]}
      </g>
    </svg>
  );
}
