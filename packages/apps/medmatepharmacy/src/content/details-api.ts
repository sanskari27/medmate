import { useEffect, useState } from "react";
import type { Details, Product } from "./catalogue";

type Api = {
  details: (id: string) => Details | undefined;
  summary: (product: Product, max?: number) => string;
};

let api: Api | null = null;

export function setProductDetails(next: Api) {
  api = next;
}

export function details(id: string) {
  return api!.details(id);
}

export function summary(product: Product, max?: number) {
  return api!.summary(product, max);
}

/** Medicine pages load the large details file on their own. Other pages never request it. */
export function useProductDetails() {
  const [ready, setReady] = useState(api !== null);
  useEffect(() => {
    if (api) return;
    let live = true;
    void import("./product-details").then((mod) => {
      setProductDetails(mod);
      if (live) setReady(true);
    });
    return () => {
      live = false;
    };
  }, []);
  return ready;
}
