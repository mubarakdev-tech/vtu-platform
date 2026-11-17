export interface MoneyFormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatMoney(
  value: number | string | null | undefined,
  options: MoneyFormatOptions = {}
): string {
  const amount = Number(value);

  if (value === null || value === undefined || value === "" || !Number.isFinite(amount)) {
    return "\u2014";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  }).format(amount);
}
