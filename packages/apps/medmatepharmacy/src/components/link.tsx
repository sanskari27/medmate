import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";

type Props = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  children?: ReactNode;
};

/** Same `href` prop the previous site used, rendered as a normal link. */
export default function Link({ href, children, ...props }: Props) {
  if (/^(https?:|mailto:|tel:)/.test(href)) {
    return <a href={href} {...props}>{children}</a>;
  }
  return <RouterLink to={href} {...props}>{children}</RouterLink>;
}
