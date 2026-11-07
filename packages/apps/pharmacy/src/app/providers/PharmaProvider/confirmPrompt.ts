import type { ConfirmTone } from "@/components/molecules/ConfirmDialog";

export type ConfirmPrompt = {
  title: string;
  body: string;
  tone: ConfirmTone;
  confirm: string;
};

const SAVE: ConfirmPrompt = {
  title: "Save this?",
  body: "This will be stored.",
  tone: "positive",
  confirm: "Save",
};

const EDIT: ConfirmPrompt = {
  title: "Save these changes?",
  body: "This replaces what is currently stored.",
  tone: "caution",
  confirm: "Save changes",
};

const PROMPTS: Record<string, ConfirmPrompt> = {
  "billing/checkoutPos": {
    title: "Create this invoice?",
    body: "The bill is saved and the medicines on this cart are sold.",
    tone: "positive",
    confirm: "Create invoice",
  },
  "sales/advanceOrder": {
    title: "Move this order forward?",
    body: "It goes to the next step, from accepted through to delivered.",
    tone: "positive",
    confirm: "Advance",
  },
  "sales/cancelOrder": {
    title: "Cancel this order?",
    body: "The order is marked cancelled and drops out of the active queue.",
    tone: "danger",
    confirm: "Cancel order",
  },
  "sales/startPacking": {
    title: "Start packing this order?",
    body: "It moves into packing so the items can be picked.",
    tone: "positive",
    confirm: "Start packing",
  },
  "sales/sealPacket": {
    title: "Seal this packet?",
    body: "Packing is finished and the packet is ready to hand over.",
    tone: "positive",
    confirm: "Seal packet",
  },
  "sales/handToRider": {
    title: "Hand this order to the rider?",
    body: "The rider details are saved and the order leaves the counter.",
    tone: "info",
    confirm: "Hand over",
  },
  "sales/markPaid": {
    title: "Mark this order paid?",
    body: "The pending amount is recorded as collected.",
    tone: "positive",
    confirm: "Mark paid",
  },
  "sales/addOffer": {
    title: "Create this offer?",
    body: "It can be applied on the counter and the online store.",
    tone: "positive",
    confirm: "Create offer",
  },
  "sales/toggleOffer": {
    title: "Pause or resume this offer?",
    body: "A running offer applies at checkout. A paused one does not.",
    tone: "caution",
    confirm: "Change offer",
  },
  "sales/settleBills": {
    title: "Settle these bills?",
    body: "The selected bills are marked paid in the chosen mode.",
    tone: "positive",
    confirm: "Settle bills",
  },
  "sales/placeKioskOrder": {
    title: "Place this kiosk order?",
    body: "The cart is billed in the payment mode the customer chose.",
    tone: "positive",
    confirm: "Place order",
  },
  "purchases/receivePurchase": {
    title: "Receive this purchase?",
    body: "The invoice is saved and the quantities are added to stock.",
    tone: "positive",
    confirm: "Receive stock",
  },
  "purchases/sendPurchaseOrder": {
    title: "Send this purchase order?",
    body: "The supplier is asked for the medicines on this order.",
    tone: "info",
    confirm: "Send order",
  },
  "purchases/importPurchaseOrders": {
    title: "Import these purchase orders?",
    body: "Each row is added to the purchase list.",
    tone: "info",
    confirm: "Import",
  },
  "purchases/markPurchaseOrderReceived": {
    title: "Mark this order received?",
    body: "The purchase order is closed as received.",
    tone: "positive",
    confirm: "Mark received",
  },
  "purchases/addExpense": {
    title: "Save this expense?",
    body: "It is added to the expense register.",
    tone: "positive",
    confirm: "Save expense",
  },
  "purchases/updateExpense": {
    title: "Update this expense?",
    body: "The register will show the new amount and details.",
    tone: "caution",
    confirm: "Update expense",
  },
  "purchases/addExpenseCategory": {
    title: "Add this expense category?",
    body: "New expenses can be filed under it.",
    tone: "positive",
    confirm: "Add category",
  },
  "purchases/addSupplier": {
    title: "Add this distributor?",
    body: "They can then be used on purchases and reorders.",
    tone: "positive",
    confirm: "Add distributor",
  },
  "purchases/updateSupplier": {
    title: "Update this distributor?",
    body: "Purchases will use the new contact and terms.",
    tone: "caution",
    confirm: "Update distributor",
  },
  "purchases/addSupply": {
    title: "Save this supply rate?",
    body: "It is added to the rate list for this medicine.",
    tone: "positive",
    confirm: "Save rate",
  },
  "purchases/updateSupply": {
    title: "Update this supply rate?",
    body: "Later purchases will use the new price.",
    tone: "caution",
    confirm: "Update rate",
  },
  "purchases/setPreferredSupply": {
    title: "Prefer this supply rate?",
    body: "Reorders will use this rate first.",
    tone: "caution",
    confirm: "Set preferred",
  },
  "prescriptions/approve": {
    title: "Approve this prescription?",
    body: "It can then be dispensed from the counter.",
    tone: "positive",
    confirm: "Approve",
  },
  "prescriptions/reject": {
    title: "Reject this prescription?",
    body: "It will not be dispensed. The reason you entered stays with it.",
    tone: "danger",
    confirm: "Reject",
  },
  "prescriptions/dispense": {
    title: "Dispense this prescription?",
    body: "Its medicines are loaded into billing.",
    tone: "positive",
    confirm: "Dispense",
  },
  "inventory/addProduct": {
    title: "Add this medicine?",
    body: "It is saved to inventory and can be billed.",
    tone: "positive",
    confirm: "Add medicine",
  },
  "inventory/importMedicines": {
    title: "Import these medicines?",
    body: "New rows are added to the catalogue. Ones already there are skipped.",
    tone: "info",
    confirm: "Import",
  },
  "inventory/updateProduct": {
    title: "Update this medicine?",
    body: "Name, price, and stock details on the card are replaced.",
    tone: "caution",
    confirm: "Update medicine",
  },
  "inventory/setProductLocation": {
    title: "Move this medicine?",
    body: "The rack label on the product is changed.",
    tone: "caution",
    confirm: "Move",
  },
  "inventory/bulkAssignLocation": {
    title: "Assign these medicines to the rack?",
    body: "Every selected product is labelled with this rack.",
    tone: "caution",
    confirm: "Assign rack",
  },
  "inventory/createRack": {
    title: "Add this rack?",
    body: "It appears on the rack map and can hold medicines.",
    tone: "positive",
    confirm: "Add rack",
  },
  "inventory/addBatch": {
    title: "Add this batch?",
    body: "The batch, expiry, and quantity are added to the medicine.",
    tone: "positive",
    confirm: "Add batch",
  },
  "inventory/setBatchQty": {
    title: "Change this batch quantity?",
    body: "On-hand stock for the batch is set to the new count.",
    tone: "caution",
    confirm: "Update quantity",
  },
  "inventory/toggleOnline": {
    title: "Change the online listing?",
    body: "This medicine is shown on the store, or hidden from it.",
    tone: "caution",
    confirm: "Change listing",
  },
  "inventory/toggleLoose": {
    title: "Change loose sale?",
    body: "This medicine can be sold loose, or only as a full pack.",
    tone: "caution",
    confirm: "Change loose sale",
  },
  "inventory/setOnlinePrice": {
    title: "Change the online price?",
    body: "The store will charge this price instead of the counter price.",
    tone: "caution",
    confirm: "Update price",
  },
  "inventory/setProductOffer": {
    title: "Apply this offer?",
    body: "The online price for this medicine follows the offer.",
    tone: "caution",
    confirm: "Apply offer",
  },
  "inventory/setDirectOffer": {
    title: "Set a direct offer?",
    body: "This medicine gets its own discount, separate from store-wide offers.",
    tone: "caution",
    confirm: "Set offer",
  },
  "inventory/setLooseDefault": {
    title: "Change the loose-sale default?",
    body: "New medicines follow this setting unless you change them.",
    tone: "caution",
    confirm: "Update default",
  },
  "inventory/setProductSupplier": {
    title: "Change the supplier?",
    body: "Reorders for this medicine go to the supplier you picked.",
    tone: "caution",
    confirm: "Change supplier",
  },
  "customers/recordCreditPayment": {
    title: "Record this payment?",
    body: "The amount is taken off the customer's khata balance.",
    tone: "positive",
    confirm: "Record payment",
  },
  "customers/addReferral": {
    title: "Add this referral?",
    body: "The doctor or partner is saved on the referral list.",
    tone: "positive",
    confirm: "Add referral",
  },
  "customers/updateReferral": {
    title: "Update this referral?",
    body: "The referral record is replaced with these details.",
    tone: "caution",
    confirm: "Update referral",
  },
  "crm/setPatientMeta": {
    title: "Update this patient?",
    body: "Notes, tags, and follow-up details on the patient are replaced.",
    tone: "caution",
    confirm: "Update patient",
  },
  "crm/addCampaign": {
    title: "Create this campaign?",
    body: "It is saved so you can reach the selected patients.",
    tone: "positive",
    confirm: "Create campaign",
  },
  "crm/addFeedback": {
    title: "Save this feedback?",
    body: "It is stored against the patient.",
    tone: "positive",
    confirm: "Save feedback",
  },
  "crm/redeemPoints": {
    title: "Redeem these points?",
    body: "The points leave the patient's loyalty balance.",
    tone: "caution",
    confirm: "Redeem points",
  },
  "hospital/addWard": {
    title: "Add this ward?",
    body: "Beds on it can then take admissions.",
    tone: "positive",
    confirm: "Add ward",
  },
  "hospital/updateWard": {
    title: "Update this ward?",
    body: "The ward card will show the new details.",
    tone: "caution",
    confirm: "Update ward",
  },
  "hospital/admitPatient": {
    title: "Admit this patient?",
    body: "The bed is taken and the admission is opened.",
    tone: "positive",
    confirm: "Admit",
  },
  "hospital/updateAdmission": {
    title: "Update this admission?",
    body: "The admission record is replaced with these details.",
    tone: "caution",
    confirm: "Update admission",
  },
  "hospital/dischargePatient": {
    title: "Discharge this patient?",
    body: "The admission closes and the bed is freed.",
    tone: "danger",
    confirm: "Discharge",
  },
  "hospital/updateHospitalAccount": {
    title: "Update the hospital account?",
    body: "Bills and credit checks will use the new details.",
    tone: "caution",
    confirm: "Update account",
  },
  "hospital/setUniformDiscount": {
    title: "Change the hospital discount?",
    body: "Medicines without a special price follow this discount.",
    tone: "caution",
    confirm: "Update discount",
  },
  "hospital/setHospitalPriceRule": {
    title: "Change this hospital price?",
    body: "Ward and credit bills for this medicine use the new price.",
    tone: "caution",
    confirm: "Update price",
  },
  "hospital/issueWardSupply": {
    title: "Issue this supply to the ward?",
    body: "Stock leaves the pharmacy and is charged to the hospital account.",
    tone: "positive",
    confirm: "Issue supply",
  },
  "hospital/returnWardSupply": {
    title: "Take this supply back?",
    body: "The quantity returns to pharmacy stock and the charge is reversed.",
    tone: "caution",
    confirm: "Return supply",
  },
  "hospital/recordHospitalPayment": {
    title: "Record this hospital payment?",
    body: "The amount is taken off the hospital's outstanding balance.",
    tone: "positive",
    confirm: "Record payment",
  },
  "hospital/addDoctor": {
    title: "Add this doctor?",
    body: "They can be chosen on admissions and bills.",
    tone: "positive",
    confirm: "Add doctor",
  },
  "hospital/updateDoctor": {
    title: "Update this doctor?",
    body: "Admissions and bills will show the new details.",
    tone: "caution",
    confirm: "Update doctor",
  },
  "hospital/addDepartment": {
    title: "Add this department?",
    body: "It can be used on wards and admissions.",
    tone: "positive",
    confirm: "Add department",
  },
  "hospital/updateDepartment": {
    title: "Update this department?",
    body: "The department record is replaced with these details.",
    tone: "caution",
    confirm: "Update department",
  },
  "hospital/issueIndent": {
    title: "Issue this indent?",
    body: "The requested stock is sent against the indent.",
    tone: "positive",
    confirm: "Issue indent",
  },
  "hospital/setIndentStatus": {
    title: "Update this indent?",
    body: "The ward will see the new status.",
    tone: "caution",
    confirm: "Update indent",
  },
  "hospital/setClaimStatus": {
    title: "Update this claim?",
    body: "The insurer claim moves to the status you chose.",
    tone: "caution",
    confirm: "Update claim",
  },
  "auth/saveLoginPin": {
    title: "Save this login PIN?",
    body: "The counter can then be unlocked with this PIN.",
    tone: "positive",
    confirm: "Save PIN",
  },
  "auth/updateProfile": {
    title: "Save pharmacy details?",
    body: "The counter, invoices, and store will use these details.",
    tone: "caution",
    confirm: "Save details",
  },
  "auth/toggleStoreOpen": {
    title: "Change whether the store is open?",
    body: "Customers see the store as open or closed from this.",
    tone: "caution",
    confirm: "Change store",
  },
  "auth/saveInvoiceSettings": {
    title: "Save invoice settings?",
    body: "New bills use this layout, title, and terms.",
    tone: "caution",
    confirm: "Save invoice",
  },
  "auth/saveKiosk": {
    title: "Save kiosk settings?",
    body: "The in-store kiosk follows these options.",
    tone: "caution",
    confirm: "Save kiosk",
  },
  "auth/addUser": {
    title: "Add this staff login?",
    body: "They can sign in with the role you set.",
    tone: "positive",
    confirm: "Add user",
  },
  "auth/updateUser": {
    title: "Update this staff login?",
    body: "Role and contact details on the login are replaced.",
    tone: "caution",
    confirm: "Update user",
  },
  "auth/toggleUser": {
    title: "Change this person's access?",
    body: "They can sign in only while the login is active.",
    tone: "caution",
    confirm: "Change access",
  },
  "auth/requestPlan": {
    title: "Request this plan?",
    body: "The team is asked to switch the pharmacy to this plan.",
    tone: "info",
    confirm: "Send request",
  },
  "auth/redeemCoupon": {
    title: "Redeem this coupon?",
    body: "The discount is applied to the subscription if the code is valid.",
    tone: "positive",
    confirm: "Redeem",
  },
  "auth/toggleAutoRenew": {
    title: "Change auto-renew?",
    body: "The subscription renews on its own only while this is on.",
    tone: "caution",
    confirm: "Change renewal",
  },
  "auth/saveBankAccount": {
    title: "Save this bank account?",
    body: "Payouts use the account name, number, and IFSC you entered.",
    tone: "caution",
    confirm: "Save account",
  },
  "auth/verifyBankAccount": {
    title: "Verify this bank account?",
    body: "A check is sent to confirm the account can receive payouts.",
    tone: "info",
    confirm: "Verify",
  },
  "auth/commitSetup": {
    title: "Finish setup?",
    body: "Your pharmacy details are saved and the counter opens.",
    tone: "positive",
    confirm: "Finish setup",
  },
  "auth/addEmployee": {
    title: "Add this employee?",
    body: "They are saved on the staff register.",
    tone: "positive",
    confirm: "Add employee",
  },
  "auth/updateEmployee": {
    title: "Update this employee?",
    body: "The staff register will show the new details.",
    tone: "caution",
    confirm: "Update employee",
  },
  "auth/addAdvisor": {
    title: "Add this advisor?",
    body: "They can receive the reports you choose to share.",
    tone: "positive",
    confirm: "Add advisor",
  },
  "auth/updateAdvisor": {
    title: "Update this advisor?",
    body: "Shared reports will go to the new contact details.",
    tone: "caution",
    confirm: "Update advisor",
  },
  "auth/shareWithCA": {
    title: "Share these reports?",
    body: "The selected reports for this period are sent to the advisor.",
    tone: "info",
    confirm: "Share",
  },
  "auth/raiseTicket": {
    title: "Raise this support ticket?",
    body: "The support team receives the subject and category you entered.",
    tone: "info",
    confirm: "Raise ticket",
  },
};

const INVOICE_UNPAID: ConfirmPrompt = {
  title: "Send this bill unpaid?",
  body: "The invoice is saved, and payment stays pending until reception collects it.",
  tone: "caution",
  confirm: "Send unpaid",
};

const INDENT_STATUS: Record<string, ConfirmPrompt> = {
  approved: {
    title: "Approve this indent?",
    body: "The ward can then be billed against it.",
    tone: "positive",
    confirm: "Approve",
  },
  rejected: {
    title: "Reject this indent?",
    body: "The ward will need to send a new request.",
    tone: "danger",
    confirm: "Reject",
  },
  pending: {
    title: "Send this indent back to pending?",
    body: "It leaves the approved or rejected list until you decide again.",
    tone: "caution",
    confirm: "Move back",
  },
};

const CLAIM_STATUS: Record<string, ConfirmPrompt> = {
  approved: {
    title: "Approve this claim?",
    body: "The insurer claim is marked approved.",
    tone: "positive",
    confirm: "Approve",
  },
  rejected: {
    title: "Reject this claim?",
    body: "The insurer claim is marked rejected.",
    tone: "danger",
    confirm: "Reject",
  },
  settled: {
    title: "Mark this claim settled?",
    body: "The claim is closed as paid by the insurer.",
    tone: "positive",
    confirm: "Mark settled",
  },
  query: {
    title: "Raise a query on this claim?",
    body: "The claim waits until the query is answered.",
    tone: "caution",
    confirm: "Raise query",
  },
  submitted: {
    title: "Mark this claim submitted?",
    body: "The claim goes back to the insurer as submitted.",
    tone: "info",
    confirm: "Mark submitted",
  },
};

const HOSPITAL_FIELDS: Record<string, ConfirmPrompt> = {
  name: {
    title: "Change the hospital name?",
    body: "Bills and statements will use this name.",
    tone: "caution",
    confirm: "Change name",
  },
  gstin: {
    title: "Update the hospital GSTIN?",
    body: "Tax invoices for this account will use the new GSTIN.",
    tone: "caution",
    confirm: "Update GSTIN",
  },
  contact: {
    title: "Change the hospital contact?",
    body: "Reminders and statements will use this contact.",
    tone: "caution",
    confirm: "Change contact",
  },
  phone: {
    title: "Change the hospital phone?",
    body: "Calls and messages for this account use the new number.",
    tone: "caution",
    confirm: "Change phone",
  },
  email: {
    title: "Change the hospital email?",
    body: "Statements for this account go to the new address.",
    tone: "caution",
    confirm: "Change email",
  },
  creditTerms: {
    title: "Change the credit terms?",
    body: "New supplies follow the terms you picked.",
    tone: "caution",
    confirm: "Change terms",
  },
  creditLimit: {
    title: "Change the credit limit?",
    body: "Further issues are checked against this limit.",
    tone: "caution",
    confirm: "Change limit",
  },
  flagRefills: {
    title: "Change refill alerts?",
    body: "Ward refill warnings follow this setting.",
    tone: "caution",
    confirm: "Change alerts",
  },
};

const WARD_FIELDS: Record<string, ConfirmPrompt> = {
  name: {
    title: "Rename this ward?",
    body: "Admissions and indents will show the new name.",
    tone: "caution",
    confirm: "Rename ward",
  },
  code: {
    title: "Change the ward code?",
    body: "Lists and bills will show the new code.",
    tone: "caution",
    confirm: "Change code",
  },
  floor: {
    title: "Change the ward floor?",
    body: "The ward card will show the new floor.",
    tone: "caution",
    confirm: "Change floor",
  },
  type: {
    title: "Change the ward type?",
    body: "The ward is grouped under the type you picked.",
    tone: "caution",
    confirm: "Change type",
  },
  beds: {
    title: "Change the bed count?",
    body: "Admissions can use only as many beds as you set.",
    tone: "caution",
    confirm: "Change beds",
  },
  sister: {
    title: "Change the ward sister?",
    body: "The ward card will show the new sister in charge.",
    tone: "caution",
    confirm: "Change sister",
  },
};

const CLEAR_OFFER: ConfirmPrompt = {
  title: "Remove this offer?",
  body: "The medicine goes back to its regular online price.",
  tone: "caution",
  confirm: "Remove offer",
};

const CLEAR_PRICE: ConfirmPrompt = {
  title: "Clear this special price?",
  body: "The medicine follows the uniform hospital discount again.",
  tone: "caution",
  confirm: "Clear price",
};

const LOGO: ConfirmPrompt = {
  title: "Update the pharmacy logo?",
  body: "Invoices and the store will show this logo.",
  tone: "caution",
  confirm: "Update logo",
};

const SIGNATURE: ConfirmPrompt = {
  title: "Update the signature?",
  body: "Invoices will show this signature.",
  tone: "caution",
  confirm: "Update signature",
};

const RENEWAL: ConfirmPrompt = {
  title: "Request a renewal?",
  body: "The team is asked to renew the current plan.",
  tone: "info",
  confirm: "Request renewal",
};

export function confirmPrompt(typePrefix: string, arg?: unknown): ConfirmPrompt {
  const key = typePrefix.replace(/\/pending$/, "");
  return specialize(key, arg) ?? PROMPTS[key] ?? fallback(key);
}

export function resolveConfirm(
  typePrefix: string,
  arg: unknown,
  options?: { kind?: "save" | "edit"; copy?: Partial<ConfirmPrompt> },
): ConfirmPrompt {
  const base = typePrefix ? confirmPrompt(typePrefix, arg) : options?.kind === "edit" ? EDIT : SAVE;
  const copy = options?.copy;
  return {
    title: copy?.title ?? base.title,
    body: copy?.body ?? base.body,
    tone: copy?.tone ?? base.tone,
    confirm: copy?.confirm ?? base.confirm,
  };
}

function specialize(key: string, arg: unknown): ConfirmPrompt | null {
  if (key === "billing/checkoutPos") return unpaid(arg) ? INVOICE_UNPAID : null;
  if (key === "hospital/setIndentStatus") return byStatus(arg, INDENT_STATUS);
  if (key === "hospital/setClaimStatus") return byStatus(arg, CLAIM_STATUS);
  if (key === "hospital/updateHospitalAccount") return byField(arg, HOSPITAL_FIELDS, false);
  if (key === "hospital/updateWard") return byField(arg, WARD_FIELDS, true);
  if (key === "auth/updateProfile") return profilePrompt(arg);
  if (key === "auth/requestPlan") return planPrompt(arg);
  if (key === "inventory/setProductOffer") return offerPrompt(arg);
  if (key === "hospital/setHospitalPriceRule") return pricePrompt(arg);
  return null;
}

function unpaid(arg: unknown): boolean {
  return isRecord(arg) && arg.paid === false;
}

function byStatus(arg: unknown, prompts: Record<string, ConfirmPrompt>): ConfirmPrompt | null {
  if (!isRecord(arg) || typeof arg.status !== "string") return null;
  return prompts[arg.status] ?? null;
}

function byField(
  arg: unknown,
  prompts: Record<string, ConfirmPrompt>,
  nested: boolean,
): ConfirmPrompt | null {
  if (!isRecord(arg)) return null;
  const source = nested && isRecord(arg.patch) ? arg.patch : arg;
  const key = Object.keys(source).find((name) => name !== "id");
  return key ? (prompts[key] ?? null) : null;
}

function profilePrompt(arg: unknown): ConfirmPrompt | null {
  if (!isRecord(arg)) return null;
  const keys = Object.keys(arg);
  if (keys.length === 1 && keys[0] === "logo") return LOGO;
  if (keys.length === 1 && keys[0] === "signature") return SIGNATURE;
  return null;
}

function planPrompt(arg: unknown): ConfirmPrompt | null {
  if (!isRecord(arg)) return null;
  return arg.kind === "renewal" ? RENEWAL : null;
}

function offerPrompt(arg: unknown): ConfirmPrompt | null {
  if (!isRecord(arg)) return null;
  return arg.offerId == null ? CLEAR_OFFER : null;
}

function pricePrompt(arg: unknown): ConfirmPrompt | null {
  if (!isRecord(arg)) return null;
  return arg.rule == null ? CLEAR_PRICE : null;
}

function fallback(typePrefix: string): ConfirmPrompt {
  const name = typePrefix.split("/").pop() ?? "";
  const words = name
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
  if (!words) return SAVE;
  const tone = toneFor(words);
  const verb = words.split(" ")[0] ?? "";
  return {
    title: sentence(words),
    body: bodyFor(tone),
    tone,
    confirm: confirmFor(verb, tone),
  };
}

function toneFor(words: string): ConfirmTone {
  if (/^(cancel|reject|delete|remove|discharge|void)\b/.test(words)) return "danger";
  if (/^(update|set|toggle|edit|change)\b/.test(words)) return "caution";
  if (/^(send|share|import|issue|hand|notify|request)\b/.test(words)) return "info";
  return "positive";
}

function bodyFor(tone: ConfirmTone): string {
  if (tone === "danger") return "This cannot be undone from this screen.";
  if (tone === "caution") return "What is stored now will be replaced.";
  if (tone === "info") return "This is sent on once you confirm.";
  return "This will be stored.";
}

function confirmFor(verb: string, tone: ConfirmTone): string {
  if (tone === "danger") return capitalize(verb);
  if (tone === "info") return capitalize(verb);
  if (tone === "caution") return "Update";
  return "Save";
}

function sentence(words: string): string {
  return capitalize(words) + "?";
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
