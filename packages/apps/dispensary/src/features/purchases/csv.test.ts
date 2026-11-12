import { describe, expect, it } from "vitest";
import { parsePurchaseCsv } from "./csv";

const sample = `product_id,batch_no,expiry,qty,free,rate,mrp,gst
DRS091817,MLB24D0650,2027-08,20,2,18.27,22.84,12
DRS074347,GSK24C0500,2027-11,10,1,15.62,19.53,12
DRS033955,ALB25A0500,2028-01,5,0,101.38,126.73,12
DRS232735,SUN25P0020,2027-09,10,1,103.50,129.38,12
DRS192698,CIP25M0010,2028-03,4,0,212.18,265.22,12
DRS136695,USV24G0250,2027-06,15,0,15.44,19.3,12
DRS280880,TOR25S0250,2028-02,6,1,130.83,163.54,12
DR036431,PFZ24B0020,2027-12,8,0,54.88,68.6,12
DR077268,RBI25D0125,2028-06,12,0,52.56,65.7,18
`;

describe("parsePurchaseCsv", () => {
  it("reads the purchase sample", () => {
    const parsed = parsePurchaseCsv(sample);
    expect(parsed.issues).toEqual([]);
    expect(parsed.lines).toHaveLength(9);
    expect(parsed.lines[0]).toMatchObject({
      productId: "DRS091817",
      batchNo: "MLB24D0650",
      expiry: "2027-08",
      qty: 20,
      freeQty: 2,
      rate: "18.27",
      mrp: "22.84",
      gst: "12",
    });
    expect(parsed.lines[8]).toMatchObject({
      productId: "DR077268",
      mrp: "65.7",
      gst: "18",
    });
  });

  it("accepts english headers and ignores extra columns", () => {
    const parsed =
      parsePurchaseCsv(`Product Id,Batch Number,Expiry Date,Quantity,Free Qty,Purchase Rate,MRP,GST %,Notes
DRS091817,MLB24D0650,2027-08,20,2,18.27,22.84,12,skip this
`);
    expect(parsed.issues).toEqual([]);
    expect(parsed.lines).toEqual([
      expect.objectContaining({
        productId: "DRS091817",
        batchNo: "MLB24D0650",
        expiry: "2027-08",
        qty: 20,
        freeQty: 2,
        rate: "18.27",
        mrp: "22.84",
        gst: "12",
      }),
    ]);
  });

  it("rejects a sheet that is missing a required column", () => {
    const parsed = parsePurchaseCsv("Product Id,Notes\nDRS091817,hello\n");
    expect(parsed.lines).toEqual([]);
    expect(parsed.issues).toEqual([{ line: 1, message: "The sample columns are required" }]);
  });
});
