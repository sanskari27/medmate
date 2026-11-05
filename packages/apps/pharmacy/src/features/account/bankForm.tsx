const blankBank = {
  holderName: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
  branch: "",
  accountType: "Current" as const,
  upiVpa: "",
};

export function bankForm(
  b: {
    holderName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
    branch?: string;
    accountType: "Savings" | "Current";
    upiVpa?: string;
  } | null,
) {
  return b
    ? {
        holderName: b.holderName,
        accountNumber: b.accountNumber,
        ifsc: b.ifsc,
        bankName: b.bankName,
        branch: b.branch ?? "",
        accountType: b.accountType,
        upiVpa: b.upiVpa ?? "",
      }
    : blankBank;
}
