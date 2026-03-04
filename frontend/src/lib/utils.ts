export const currency = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");
