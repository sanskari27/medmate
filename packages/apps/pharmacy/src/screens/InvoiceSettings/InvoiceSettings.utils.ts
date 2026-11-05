export function thermalPreviewClass(template: string) {
  return template === "thermal"
    ? "!bg-[repeating-linear-gradient(#fff,#fff_22px,#fafafa_22px,#fafafa_23px)] !p-[18px]"
    : "";
}
