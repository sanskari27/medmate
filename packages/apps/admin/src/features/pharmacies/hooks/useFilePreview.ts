import { useEffect, useState } from "react";
import { isRemoteFile } from "../ownerModel";
import { problemMessage } from "../problemMessage";
import { useReadDocumentQuery } from "../services/pharmacies.api";
import type { OwnerDocument } from "../types";

export function useFilePreview(document: OwnerDocument | null): {
  src: string | null;
  error: string | null;
  loading: boolean;
} {
  const remote = document ? isRemoteFile(document.url) : false;
  const path = document && !remote ? document.url : "";
  const query = useReadDocumentQuery(path, { skip: path.length === 0 });
  const blob = query.currentData;
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setObjectUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [blob]);

  if (!document) return { src: null, error: null, loading: false };
  if (remote) return { src: document.url, error: null, loading: false };
  return {
    src: objectUrl,
    error: query.isError ? problemMessage(query.error, "Could not open this file") : null,
    loading: query.isLoading || query.isFetching,
  };
}
