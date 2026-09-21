import type { ApartmentPairListing } from '@workspace/api-client-react';

const distanceGuesstimates: Record<string, string> = {
  Pool: '≈ 10 min walk (5–20)',
  Beach: '≈ 15 min walk (5–25)',
  Groceries: '≈ 8 min walk (4–15)',
  Cafes: '≈ 10 min walk (5–20)',
  'Pair Dist.': '≈ 1,200 m (600–2,000)',
};

export function getDistanceDisplay(label: string, value: string) {
  const isMissing = !value || /not stated|not verified|unknown|unconfirmed/i.test(value);
  const isExplicitEstimate = /\bapproximately\b|\bapprox\.?\b|\bestimat(?:e|ed|ion)\b/i.test(value);
  return {
    value: isMissing ? distanceGuesstimates[label] ?? 'Estimate unavailable' : value,
    isGuesstimate: isMissing || isExplicitEstimate,
  };
}

export function getSizeDisplay(listing: Pick<ApartmentPairListing, 'sizeSqm' | 'bedrooms'>) {
  if (listing.sizeSqm !== null) {
    return { value: `${listing.sizeSqm} m²`, isGuesstimate: false };
  }

  const value = listing.bedrooms === null
    ? '≈ 55 m² (35–75)'
    : listing.bedrooms <= 1
      ? '≈ 45 m² (30–60)'
      : listing.bedrooms === 2
        ? '≈ 65 m² (50–80)'
        : '≈ 85 m² (65–105)';

  return { value, isGuesstimate: true };
}