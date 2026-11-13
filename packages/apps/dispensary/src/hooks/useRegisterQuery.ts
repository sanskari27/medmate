import { useSearchParams } from "react-router-dom";

export type RegisterPatch = Record<string, string | number | null>;

export function useRegisterQuery() {
  const [params, setParams] = useSearchParams();
  const pageRaw = Number(params.get("page") ?? "1");
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  function setQuery(patch: RegisterPatch, options?: { keepPage?: boolean }) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        const touchesPage = Object.prototype.hasOwnProperty.call(patch, "page");
        for (const [key, value] of Object.entries(patch)) {
          const empty =
            value === null || value === "" || (key === "page" && (value === 1 || value === "1"));
          if (empty) next.delete(key);
          else next.set(key, String(value));
        }
        if (!options?.keepPage && !touchesPage) next.delete("page");
        return next;
      },
      { replace: true },
    );
  }

  return {
    q: params.get("q") ?? "",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    page,
    get: (key: string) => params.get(key) ?? "",
    setQuery,
  };
}
