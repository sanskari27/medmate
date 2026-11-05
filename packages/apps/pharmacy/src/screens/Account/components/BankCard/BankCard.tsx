import { useState } from "react";
import { usePharma } from "@/hooks";
import { isValidIfsc } from "@/utils";
import { IconCheck, IconBank } from "@/components/Icon";

import { bankForm } from "@/screens/Account/utils/bankForm";

const blankBank = {
  holderName: "",
  accountNumber: "",
  ifsc: "",
  bankName: "",
  branch: "",
  accountType: "Current" as const,
  upiVpa: "",
};

export function BankCard() {
  const { bankAccount, saveBankAccount, verifyBankAccount, removeBankAccount } = usePharma();
  const [f, setF] = useState(() => bankForm(bankAccount));
  const set = (patch: Partial<typeof f>) => setF((p) => ({ ...p, ...patch }));
  const ifscOk = isValidIfsc(f.ifsc);
  const canSave =
    !!f.holderName.trim() && !!f.accountNumber.trim() && !!f.bankName.trim() && ifscOk;
  const save = async () => {
    await saveBankAccount({
      holderName: f.holderName.trim(),
      accountNumber: f.accountNumber.replace(/\s/g, ""),
      ifsc: f.ifsc.trim().toUpperCase(),
      bankName: f.bankName.trim(),
      branch: f.branch.trim() || undefined,
      accountType: f.accountType,
      upiVpa: f.upiVpa.trim() || undefined,
    });
  };
  return (
    <div className="pd-card" id="pd-bank" style={{ marginTop: 16 }}>
      <div className="pd-card-head">
        <h3>
          <span className="pd-flex pd-gap6">
            <IconBank size={16} /> Payout bank account
          </span>
        </h3>
        {bankAccount?.verified ? (
          <span className="pd-pill pill-green">
            <IconCheck size={12} /> Verified
          </span>
        ) : bankAccount ? (
          <span className="pd-pill pill-gold">Verification pending</span>
        ) : null}
      </div>
      <div className="pd-card-pad">
        <div className="pd-form-grid">
          <div className="pd-field">
            <label>Account holder</label>
            <input
              className="pd-input"
              value={f.holderName}
              onChange={(e) => set({ holderName: e.target.value })}
            />
          </div>
          <div className="pd-field">
            <label>Account number</label>
            <input
              className="pd-input pd-mono"
              value={f.accountNumber}
              onChange={(e) => set({ accountNumber: e.target.value })}
            />
          </div>
          <div className="pd-field" data-field="ifsc">
            <label>IFSC</label>
            <input
              className="pd-input pd-mono"
              value={f.ifsc}
              onChange={(e) => set({ ifsc: e.target.value.toUpperCase() })}
              placeholder="HDFC0001234"
            />
          </div>
          <div className="pd-field">
            <label>Bank</label>
            <input
              className="pd-input"
              value={f.bankName}
              onChange={(e) => set({ bankName: e.target.value })}
            />
          </div>
          <div className="pd-field">
            <label>Branch</label>
            <input
              className="pd-input"
              value={f.branch}
              onChange={(e) => set({ branch: e.target.value })}
            />
          </div>
          <div className="pd-field">
            <label>Type</label>
            <select
              className="pd-select"
              value={f.accountType}
              onChange={(e) => set({ accountType: e.target.value as "Savings" | "Current" })}
            >
              <option>Current</option>
              <option>Savings</option>
            </select>
          </div>
          <div className="pd-field pd-span2">
            <label>UPI (optional)</label>
            <input
              className="pd-input"
              value={f.upiVpa}
              onChange={(e) => set({ upiVpa: e.target.value })}
              placeholder="name@upi"
            />
          </div>
        </div>
        {f.ifsc.trim() && !ifscOk ? (
          <p className="pd-muted" style={{ fontSize: 12, color: "var(--rose)", marginTop: 8 }}>
            Enter a valid IFSC (4 letters, 0, then 6 characters).
          </p>
        ) : null}
        <div className="pd-flex pd-gap6" style={{ marginTop: 14 }}>
          <button className="pd-btn pd-btn-primary" disabled={!canSave} onClick={save}>
            Save account
          </button>
          {bankAccount && !bankAccount.verified ? (
            <button className="pd-btn pd-btn-ghost" onClick={verifyBankAccount}>
              Mark verified
            </button>
          ) : null}
          {bankAccount ? (
            <button
              className="pd-btn pd-btn-ghost"
              style={{ color: "var(--rose)" }}
              onClick={() => {
                removeBankAccount();
                setF(blankBank);
              }}
            >
              Remove
            </button>
          ) : null}
        </div>
        <p className="pd-muted" style={{ fontSize: 12, marginTop: 8 }}>
          Verification is stored on this pharmacy. No bank is contacted.
        </p>
      </div>
    </div>
  );
}
