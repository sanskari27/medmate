import { useEffect, useState } from "react";
import type { ApplicationDocument } from "../types";
import { isRemoteFile } from "../reviewModel";
import { problemMessage } from "../problemMessage";
import { useReadDocumentQuery } from "../services/reviews.api";

export function useFilePreview(document: ApplicationDocument | null): {
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
