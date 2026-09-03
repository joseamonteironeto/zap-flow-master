export const CREDIT_PACKAGES = [
  { credits: 500, label: "500", price: 49, detail: "Para uso pontual" },
  { credits: 1500, label: "1.500", price: 119, detail: "Mais escolhido" },
  { credits: 5000, label: "5.000", price: 329, detail: "Melhor custo" },
] as const;

export function calculateCreditPrice(credits: number) {
  if (credits <= 500) return (credits * 49) / 500;
  if (credits <= 1500) return 49 + ((credits - 500) * 70) / 1000;
  if (credits <= 5000) return 119 + ((credits - 1500) * 210) / 3500;
  return 329 + ((credits - 5000) * 329) / 5000;
}

export function roundedCreditPrice(credits: number) {
  return Math.round(calculateCreditPrice(credits) * 100) / 100;
}
