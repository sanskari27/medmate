import icons from "@/assets/icons.json";

type IconProps = {
  name: keyof typeof icons;
  size?: number;
};

export function Icon({ name, size = 20 }: IconProps) {
  const path = icons[name];
  return (
    <svg
      className="i"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: path }}
    />
  );
}
