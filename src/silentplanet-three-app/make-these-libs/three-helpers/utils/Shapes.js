import * as THREE from 'three';
import { createBasicMeshBasicMaterial } from './Materials';

/**
 * Create a sphere mesh with the specified parameters.
 * 
 * @param {Object} options - Configuration options for the sphere.
 * @param {number} [options.radius=1] - The radius of the sphere.
 * @param {number} [options.widthSegments=16] - The number of horizontal segments.
 * @param {number} [options.heightSegments=16] - The number of vertical segments.
 * @param {THREE.Material} [options.material=null] - The material of the sphere. If null, a new basic material will be created.
 * @returns {THREE.Mesh} The created sphere mesh.
 * 
 * @example
 * // Example usage:
 * const sphere = createSphere({
 *   radius: 2,
 *   widthSegments: 32,
 *   heightSegments: 32,
 *   material: new THREE.MeshStandardMaterial({ color: 0xff0000 })
 * });
 */
export function createSphere({
    radius = 1, 
    widthSegments = 16,
    heightSegments = 16,
    material = null
} = {}) {
  var sphereGeometry = new THREE.SphereGeometry(
      radius,
      widthSegments,
      heightSegments
  )
  if (!material) {
      material = createBasicMeshBasicMaterial();
  }
  return new THREE.Mesh(sphereGeometry, material)
}