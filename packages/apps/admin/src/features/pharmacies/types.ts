export type BlockState = "clear" | "requested" | "blocked";

export type OwnerSummary = {
  pharmacyId: string;
  name: string | null;
  phone: string;
  status: string;
  blockState: BlockState;
};

export type OwnerDocument = {
  slot: string;
  contentType: string;
  url: string;
};

export type BlockRequest = {
  id: string;
  reason: string;
  requestedAt: string;
};

export type ExtraDetail = {
  label: string;
  value: string;
};

export type ReviewEvent = {
  stage: string;
  decision: string;
  comment: string | null;
  actor: string;
  at: string;
};

export type BlockHistory = {
  reason: string;
  status: string;
  requestedBy: string;
  requestedAt: string;
  decidedBy: string;
  decidedAt: string | null;
};

export type OwnerDetail = {
  pharmacyId: string;
  status: string;
  rejection: { stage: string; comment: string } | null;
  phone: string;
  name: string | null;
  tagline: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  businessTypes: string[];
  industry: string | null;
  registrationType: string | null;
  pharmacyType: string | null;
  gstin: string | null;
  pan: string | null;
  drugLicenceNo: string | null;
  fssaiNo: string | null;
  tradeLicenceNo: string | null;
  enableTds: boolean;
  enableTcs: boolean;
  pharmacistName: string | null;
  invoicePrefix: string | null;
  terms: string | null;
  acceptOnlineOrders: boolean;
  selfOrderKiosk: boolean;
  eInvoicing: boolean;
  looseSelling: boolean;
  lowStockAlerts: boolean;
  submittedAt: string | null;
  createdAt: string | null;
  extraDetails: ExtraDetail[];
  reviews: ReviewEvent[];
  blockHistory: BlockHistory[];
  documents: OwnerDocument[];
  blockState: BlockState;
  request: BlockRequest | null;
};

export type InsightCount = { label: string; count: number };

export type InsightRank = { pharmacyId: string; name: string; value: string };

export type PharmacyFleet = {
  total: number;
  status: {
    approved: number;
    blocked: number;
    complianceReview: number;
    finalReview: number;
    incomplete: number;
    rejected: number;
  };
  byStatus: InsightCount[];
  byType: InsightCount[];
  byCity: InsightCount[];
  byState: InsightCount[];
  byIndustry: InsightCount[];
  byRegistration: InsightCount[];
  byBusinessType: InsightCount[];
  features: {
    pharmacies: number;
    onlineOrders: number;
    kiosk: number;
    eInvoicing: number;
    looseSelling: number;
    lowStockAlerts: number;
  };
  timing: { daysToSubmit: string | null; daysToDecision: string | null };
  dormant: {
    total: number;
    pharmacies: { pharmacyId: string; name: string; approvedAt: string }[];
  };
  support: { open: number; medianResolveHours: string | null };
  rankingRange: string;
  rankings: {
    sales: InsightRank[];
    credit: InsightRank[];
    returns: InsightRank[];
    expiring: InsightRank[];
    tickets: InsightRank[];
  };
};

export type PharmacyInsights = {
  range: string;
  from: string;
  to: string;
  commercial: {
    today: {
      netSales: string;
      bills: number;
      averageBill: string;
      units: number;
      cash: string;
      credit: string;
      returns: string;
      returnCount: number;
    };
    month: { netSales: string; purchases: string; expenses: string; netProfit: string };
    window: {
      netSales: string;
      bills: number;
      averageBill: string;
      units: number;
      cash: string;
      creditSales: string;
      collected: { cash: string; upi: string; card: string };
      taxable: string;
      cogs: string;
      gross: string;
      margin: string;
      expenses: string;
      netProfit: string;
      returns: string;
      returnCount: number;
      returnRate: string;
      topExpenses: { category: string; amount: string }[];
      gst: { outward: string; inward: string; position: string; amount: string };
      dues: {
        bills: number;
        outstanding: string;
        buckets: { bucket: string; bills: number; amount: string }[];
      };
      distributorOutstanding: string;
      lastSale: string | null;
      lastPurchase: string | null;
    };
  };
  stock: {
    products: number;
    batches: number;
    cost: string;
    retail: string;
    low: number;
    out: number;
    expiring: number;
    expiredQty: number;
    expiredValue: string;
    expiringValue: string;
    prescriptionShare: string;
    racksInUse: number;
    emptyRacks: number;
    attention: { name: string; onHand: number; reorder: number }[];
    expiringSoon: {
      name: string;
      batchNo: string;
      expiry: string;
      qty: number;
      months: number;
      expired: boolean;
    }[];
  };
  people: {
    staff: {
      count: number;
      disabled: number;
      members: { name: string; disabled: boolean; permissions: number }[];
    };
    employees: {
      active: number;
      inactive: number;
      fullTime: number;
      partTime: number;
      contract: number;
    };
    patients: { buyers: number; repeat: number; consented: number };
    crm: {
      reminders: { kind: string; count: number }[];
      pointsRedeemed: number;
      campaigns: number;
      reach: number;
      rating: string | null;
      nps: string | null;
    };
    offers: { percent: number; flat: number; stampedLines: number };
  };
  cases: {
    ticketNumber: number;
    category: string;
    status: string;
    assignee: string;
    createdAt: string;
    resolvedAt: string | null;
  }[];
};
