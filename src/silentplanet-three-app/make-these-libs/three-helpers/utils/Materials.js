import * as THREE from 'three';
import { newThreeColour } from './Colours';

const DEFAULT_COLOR = 0xFFFFFF;

/**
 * Create a basic THREE material with minimal inputs.
 * @param {number|string} color - The color of the material (hex number or string).
 * @param {boolean} [wireframe=false] - Whether to render the material as wireframe.
 * @returns {THREE.MeshBasicMaterial} The created basic material.
 */
export function createBasicMeshBasicMaterial(color = DEFAULT_COLOR, wireframe = false) {
  return new THREE.MeshBasicMaterial({
    color: newThreeColour(color),
    wireframe: wireframe
  });
}

  
/**
 * Create a MeshBasicMaterial with the specified parameters.
 * 
 * @param {Object} options - Configuration options for the material.
 * @param {string|number} [options.color=DEFAULT_COLOR] - The color of the material (hex string or number).
 * @param {boolean} [options.wireframe=false] - Whether to display the material as a wireframe.
 * @param {boolean} [options.transparent=false] - Whether the material is transparent.
 * @param {number} [options.opacity=1] - The opacity of the material (0 to 1).
 * @param {THREE.Side} [options.side=THREE.DoubleSide] - Which side of the geometry to render.
 * @returns {THREE.MeshBasicMaterial} The created MeshBasicMaterial.
 */
export function createMeshBasicMaterial({
  color = DEFAULT_COLOR,
  wireframe = false,
  transparent = false,
  opacity = 1,
  side = THREE.DoubleSide,
} = {}) {
  return new THREE.MeshBasicMaterial({
    color: newThreeColour(color),
    side: side,
    wireframe: wireframe,
    transparent: transparent,
    opacity: opacity
  });
}
  
  
//   /**
//    * Create a debug material that provides maximum visual information.
//    * @param {Object} options - Configuration options for the debug material.
//    * @param {boolean} [options.wireframe=true] - Whether to render the material as wireframe.
//    * @param {boolean} [options.transparent=true] - Whether the material should be transparent.
//    * @param {number} [options.opacity=0.75] - The opacity of the material (0 to 1).
//    * @returns {THREE.MeshNormalMaterial} The created debug material.
//    */
//   export function createDebugMaterial({
//     wireframe = true,
//     transparent = true,
//     opacity = 0.75
//   } = {}) {
//     return new THREE.MeshNormalMaterial({
//       wireframe,
//       transparent,
//       opacity,
//       side: THREE.DoubleSide
//     });
//   }
  
//   /**
//    * Create a standard THREE material with common inputs.
//    * @param {Object} options - Configuration options for the standard material.
//    * @param {number|string} [options.color=DEFAULT_COLOR] - The color of the material (hex number or string).
//    * @param {boolean} [options.wireframe=false] - Whether to render the material as wireframe.
//    * @param {boolean} [options.transparent=false] - Whether the material should be transparent.
//    * @param {number} [options.opacity=1] - The opacity of the material (0 to 1).
//    * @param {number} [options.roughness=0.5] - The roughness of the material (0 to 1).
//    * @param {number} [options.metalness=0.5] - The metalness of the material (0 to 1).
//    * @param {THREE.Side} [options.side=THREE.FrontSide] - Which side of the geometry to render.
//    * @returns {THREE.MeshStandardMaterial} The created standard material.
//    */
//   export function createStandardMeshMaterial({
//     color = DEFAULT_COLOR,
//     wireframe = false,
//     transparent = false,
//     opacity = 1,
//     roughness = 0.5,
//     metalness = 0.5,
//     side = THREE.FrontSide
//   } = {}) {
//     return new THREE.MeshStandardMaterial({
//       color: newThreeColour(color),
//       wireframe,
//       transparent,
//       opacity,
//       roughness,
//       metalness,
//       side
//     });
//   }