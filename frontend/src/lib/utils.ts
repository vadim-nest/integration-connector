export const formatCurrency = (cents: number | string | null | undefined) => {
  const n =
    typeof cents === "string"
      ? Number(cents)
      : typeof cents === "number"
        ? cents
        : 0;

  const safe = Number.isFinite(n) ? n : 0;

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(safe / 100);
};
