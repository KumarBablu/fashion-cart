export function formatINR(amount: number | string | { toString(): string } | null | undefined): string {
  if (amount === null || amount === undefined) return "₹0";
  const n = typeof amount === "number" ? amount : Number(amount.toString());
  if (isNaN(n)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function discountPercent(price: number, compareAt?: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
