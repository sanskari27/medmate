type Kyc = {
  gstin: string;
  pan: string;
  dlNo: string;
  fssai: string;
  pharmacist?: string;
  bank?: { bankName?: string; accountNumber?: string; ifsc?: string } | null;
};

export function kycGaps(row: { kyc: Kyc }) {
  return [!row.kyc.gstin && "GSTIN", !row.kyc.pan && "PAN", !row.kyc.dlNo && "Drug licence"].filter(
    Boolean,
  ) as string[];
}
