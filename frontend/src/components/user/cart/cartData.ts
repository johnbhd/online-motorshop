export const cartCurrencyFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 2,
});

export function formatCartCurrency(amount: number): string {
  return cartCurrencyFormatter.format(amount);
}
