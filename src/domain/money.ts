export type MinorUnits = number;

export function dollarsFromMinor(minor: MinorUnits): number {
  return minor / 100;
}

export function minorFromDollars(dollars: number): MinorUnits {
  return Math.round(dollars * 100);
}

export function formatMoney(minor: MinorUnits, currency: string = "USD"): string {
  const dollars = dollarsFromMinor(minor);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(dollars);
}
