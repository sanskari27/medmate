import QRCode from "qrcode";

/** QR code as an inline SVG string. Synchronous so server HTML and hydration match. */
export function qrSvg(text: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "M" });
  const size = qr.modules.size;
  const cells: string[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (qr.modules.get(x, y)) cells.push(`M${x} ${y}h1v1h-1z`);
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#FFFFFF"/><path fill="#1B3D29" d="${cells.join("")}"/></svg>`;
}
