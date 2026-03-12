/**
 * Calcule les limites géographiques (bounds) à partir d'une liste d'adresses.
 */

interface Address {
  lat: number;
  lon: number;
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const PADDING_RATIO = 0.1;

export const calculateBounds = (addresses: Address[]): Bounds | undefined => {
  if (addresses.length === 0) return undefined;

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;

  addresses.forEach((addr) => {
    if (addr.lat < minLat) minLat = addr.lat;
    if (addr.lat > maxLat) maxLat = addr.lat;
    if (addr.lon < minLon) minLon = addr.lon;
    if (addr.lon > maxLon) maxLon = addr.lon;
  });

  const latPadding = (maxLat - minLat) * PADDING_RATIO;
  const lonPadding = (maxLon - minLon) * PADDING_RATIO;

  return {
    minLat: minLat - latPadding,
    maxLat: maxLat + latPadding,
    minLon: minLon - lonPadding,
    maxLon: maxLon + lonPadding,
  };
};
