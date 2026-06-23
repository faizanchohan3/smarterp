// Currency formatting utility - PKR (Pakistani Rupees)
export const CURRENCY_SYMBOL = "Rs.";
export const CURRENCY_CODE = "PKR";

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return `${CURRENCY_SYMBOL} 0`;
  return `${CURRENCY_SYMBOL} ${num.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString("en-PK");
}
