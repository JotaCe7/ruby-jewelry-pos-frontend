// Mirrors the backend's ComboProrationService — used only for a live
// preview before submit; the server recomputes authoritatively.
export function computeProration(weights: number[], totalDiscount: number): number[] {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (!totalWeight) return weights.map(() => 0);

  const discounts: number[] = [];
  let running = 0;
  weights.forEach((weight, index) => {
    if (index === weights.length - 1) {
      discounts.push(Math.round((totalDiscount - running) * 100) / 100);
    } else {
      const share = Math.round(((totalDiscount * weight) / totalWeight) * 100) / 100;
      discounts.push(share);
      running += share;
    }
  });
  return discounts;
}
