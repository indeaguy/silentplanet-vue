import * as THREE from 'three';
  
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

/**
 * Formats camera data into a readable string
 * @param {THREE.Camera} camera 
 * @returns {string}
 */
export function formatCameraData(camera) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    
    return {
        position: {
            x: camera.position.x.toFixed(2),
            y: camera.position.y.toFixed(2),
            z: camera.position.z.toFixed(2)
        },
        direction: {
            x: direction.x.toFixed(2),
            y: direction.y.toFixed(2),
            z: direction.z.toFixed(2)
        },
        distance: camera.position.length().toFixed(2)
    };
}