/**
 * Returns a normalized distance between 0 and 1 based on the distance and a max and min distance
 * 
 * @param {number} distance 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
export function calculateNormalizedDistance(distance, min, max) {
  if (distance > max) {
    return 1;
  } else if (distance < min) {
    return 0;
  } else {
    return (distance - min) / (max - min);
  }
}