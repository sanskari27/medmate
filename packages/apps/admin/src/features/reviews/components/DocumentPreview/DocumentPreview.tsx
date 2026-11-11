import { Box } from "@/components/ui/Box";
import { Text } from "@/components/ui/Text";

export function DocumentPreview({
  label,
  contentType,
  src,
  error,
  loading,
}: {
  label: string;
  contentType: string;
  src: string | null;
  error: string | null;
  loading: boolean;
}) {
  return (
    <Box className="grid min-h-[280px] place-items-center overflow-hidden rounded-lg border border-line bg-wash-2">
      {error ? (
        <Text className="px-4 text-center text-[13px] font-bold text-rose">{error}</Text>
      ) : loading || !src ? (
        <Text className="text-[13px] text-muted">Opening file</Text>
      ) : contentType.startsWith("image/") ? (
        <img src={src} alt={label} className="max-h-[480px] w-full object-contain" />
      ) : contentType === "application/pdf" ? (
        <iframe title={label} src={src} className="h-[480px] w-full bg-paper" />
      ) : (
        <Text className="px-4 text-center text-[13px] text-muted">
          This file cannot be previewed.
        </Text>
      )}
    </Box>
  );
}
