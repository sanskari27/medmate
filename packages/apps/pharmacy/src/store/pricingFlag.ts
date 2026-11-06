let unlocked = false;

export function setPricingFlag(value: boolean) {
  unlocked = value;
}

export function pricingUnlocked() {
  return unlocked;
}
