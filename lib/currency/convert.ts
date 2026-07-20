export function convertUahToUsd(uah: number, usdRate: number): number {
  if (!Number.isFinite(uah) || !Number.isFinite(usdRate) || usdRate <= 0) {
    return 0
  }
  const usd = uah / usdRate
  return Math.round(usd * 100) / 100
}
