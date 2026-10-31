export const EARTH_RADIUS_METERS = 6_371_000;
export const ENCOUNTER_DISTANCE_METERS = 20;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

export function haversineDistance(first, second) {
  const latitudeDifference = toRadians(second.latitude - first.latitude);
  const longitudeDifference = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);

  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.asin(Math.sqrt(Math.min(1, haversineValue)))
  );
}
