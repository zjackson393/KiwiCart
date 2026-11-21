// https://en.wikipedia.org/wiki/Haversine_formula
export function distanceKm(a: { lat: number, lng : number }, b: { lat: number, lng : number}) : number {
    const EARTH_RADIUS_KM = 6371;
    const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

    const distanceLat = toRadians(b.lat - a.lat);
    const distanceLng = toRadians(b.lng - a.lng);
    const latA = toRadians(a.lat);
    const latB = toRadians(b.lat);

    const dist = Math.sin(distanceLat / 2) ** 2 + Math.cos(latA) * Math.cos(latB) * Math.sin(distanceLng / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(dist));
}
