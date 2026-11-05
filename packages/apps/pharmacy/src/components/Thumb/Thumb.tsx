import { InvProduct } from "@/utils";
import { monogramOf } from "@/components/EntityIcon";

/** Product thumbnail: shows the uploaded photo, else a deterministic monogram. Place inside an `.em` box. */
export function Thumb({ p }: { p: InvProduct }) {
  return p.image ? (
    <img className="pd-thumb" src={p.image} alt={p.name} />
  ) : (
    <>{monogramOf(p.name)}</>
  );
}
