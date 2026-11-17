/**
 * The clinic accounts the local run seeds.
 *
 * They stand in for the staff a clinic admin would create, and they let a
 * developer sign in without asking anyone for an account.
 */
export const DEMO_ACCOUNTS = [
  { phone: "9845012345", name: "Dr. Ananya Rao", role: "owner" },
  { phone: "9741022981", name: "Dr. Meghana Iyer", role: "doctor" },
  { phone: "9986041277", name: "Dr. Vikram Shenoy", role: "doctor" },
  { phone: "9880433120", name: "Kiran Bhat", role: "admin" },
  { phone: "9886244120", name: "Mary Joseph", role: "nurse" },
  { phone: "9900122331", name: "Priya Shetty", role: "front desk" },
  { phone: "9876500011", name: "Reception desk", role: "front desk, no grants" },
];

/** The code a local run sends. */
export const DEMO_CODE = "123456";

/** The PIN the demo accounts carry. */
export const DEMO_PIN = "1234";
