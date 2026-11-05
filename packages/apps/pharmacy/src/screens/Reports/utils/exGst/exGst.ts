export const exGst = (price: number, qty: number, gst: number) => (price * qty) / (1 + gst / 100);
