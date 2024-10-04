import * as THREE from 'three';

const PARSE_INT_AS_HEX = 16;
const DEFAULT_COLOR = 0xFFFFFF;

// @TODO use least-recently-used (LRU) cache?
// @TODO expose this to pinia store
const colorCache = new Map();

/**
 * Mesh Visibility helpers
 */

/**
 * Toggles the mesh visibility
 * 
 * @param {THREE.Mesh} mesh 
 * @returns {void}
 */
export function toggleMeshVisibility(mesh) {
  if (mesh) {
    mesh.visible = !mesh.visible;
  }
}

/**
 * Hides the mesh
 * 
 * @param {THREE.Mesh} mesh 
 * @returns {void}
 */
export function hideMesh(mesh) {
  if (mesh) {
    mesh.visible = false;
  }
}

/**
 * Shows the mesh
 * 
 * @param {THREE.Mesh} mesh 
 * @returns {void}
 */
export function showMesh(mesh) {
  if (mesh) {
    mesh.visible = true;
  }
}

/**
 * Updates the mesh color
 * 
 * @param {THREE.Mesh} mesh 
 * @param {THREE.Color} colour 
 */
export function updateMeshColor(mesh, colour) {
  if (mesh && mesh.material && colour && colour instanceof THREE.Color) {
    mesh.material.color.set(colour);
  }
}

/**
 * Colour helpers
 */

/**
 * Creates a new THREE.Color object from a string or integer
 * 
 * @param {string|number} color 
 * @returns {THREE.Color}
 */
export function newThreeColour(color = DEFAULT_COLOR) {
  // Check if the color is already in the cache
  if (colorCache.has(color)) {
    return colorCache.get(color);
  }

  let threeColor;
  try {
    if (typeof color === 'number' && Number.isInteger(color) && color >= 0 && color <= DEFAULT_COLOR) {
      threeColor = new THREE.Color(color); // it's a valid hex integer
    } else if (typeof color === 'string') {
      // Check if it's a valid hex color string
      if (isValidHexColour(color)) {
        threeColor = new THREE.Color(color);
      } else {
        // Remove '#' if #RRGGBB format
        color = color.replace(/^#/, '');
        // Remove '0x' if 0xRRGGBB format
        color = color.replace(/^0x/, '');
        // Parse as hexadecimal
        const parsedColor = parseInt(color, PARSE_INT_AS_HEX);
        if (!isNaN(parsedColor) && parsedColor >= 0 && parsedColor <= DEFAULT_COLOR) {
          threeColor = new THREE.Color(parsedColor);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing color: ${color}`, error);
  }

  if (!threeColor) {
    console.warn(`Invalid color value: ${color}. Using default color.`);
    threeColor = new THREE.Color(color); // Default to white
  }

  // Cache the new color instance
  colorCache.set(color, threeColor);

  return threeColor;
}

/**
 * Fades the mesh colour by the camera distance
 * 
 * @param {THREE.Mesh} mesh 
 * @param {THREE.Color} fromColor 
 * @param {THREE.Color} toColor 
 * @param {number} cameraDistance 
 * @param {number} fadeMinDistance 
 * @param {number} fadeMaxDistance 
 * @param {number} fadeSpeed 
 * @returns {void}
 */
export function fadeMeshColourByCameraDistance(
  mesh, 
  fromColor, 
  toColor, 
  cameraDistance, 
  fadeMinDistance, 
  fadeMaxDistance, 
  fadeSpeed
) {
  if (!mesh || !mesh.material || !fromColor || !toColor) {
    return;
  }
  const fromThreeColor = newThreeColour(fromColor);
  const toThreeColor = newThreeColour(toColor);
  const normalizedDistance = calculateNormalizedDistance(cameraDistance, fadeMinDistance, fadeMaxDistance);
  const color = new THREE.Color().lerpColors(fromThreeColor, toThreeColor, normalizedDistance);
  mesh.material.color.lerp(color, fadeSpeed);
}

/**
 * Returns a normalized distance between 0 and 1 based on the distance and a max and min distance
 * 
 * @param {number} distance 
 * @param {number} min 
 * @param {number} max 
 * @returns {number}
 */
function calculateNormalizedDistance(distance, min, max) {
  if (distance > max) {
    return 1;
  } else if (distance < min) {
    return 0;
  } else {
    return (distance - min) / (max - min);
  }
}

/**
 * Checks if a string is a valid hex color
 * 
 * @param {string} colour 
 * @returns {boolean}
 */
function isValidHexColour(colour) {
  return /^#[0-9A-F]{6}$/i.test(colour);
}

/**
 * Mesh shapes
 */

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

/**
 * Mesh materials
 */

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
 * Create a debug material that provides maximum visual information.
 * @param {Object} options - Configuration options for the debug material.
 * @param {boolean} [options.wireframe=true] - Whether to render the material as wireframe.
 * @param {boolean} [options.transparent=true] - Whether the material should be transparent.
 * @param {number} [options.opacity=0.75] - The opacity of the material (0 to 1).
 * @returns {THREE.MeshNormalMaterial} The created debug material.
 */
export function createDebugMaterial({
  wireframe = true,
  transparent = true,
  opacity = 0.75
} = {}) {
  return new THREE.MeshNormalMaterial({
    wireframe,
    transparent,
    opacity,
    side: THREE.DoubleSide
  });
}

/**
 * Create a standard THREE material with common inputs.
 * @param {Object} options - Configuration options for the standard material.
 * @param {number|string} [options.color=DEFAULT_COLOR] - The color of the material (hex number or string).
 * @param {boolean} [options.wireframe=false] - Whether to render the material as wireframe.
 * @param {boolean} [options.transparent=false] - Whether the material should be transparent.
 * @param {number} [options.opacity=1] - The opacity of the material (0 to 1).
 * @param {number} [options.roughness=0.5] - The roughness of the material (0 to 1).
 * @param {number} [options.metalness=0.5] - The metalness of the material (0 to 1).
 * @param {THREE.Side} [options.side=THREE.FrontSide] - Which side of the geometry to render.
 * @returns {THREE.MeshStandardMaterial} The created standard material.
 */
export function createStandardMeshMaterial({
  color = DEFAULT_COLOR,
  wireframe = false,
  transparent = false,
  opacity = 1,
  roughness = 0.5,
  metalness = 0.5,
  side = THREE.FrontSide
} = {}) {
  return new THREE.MeshStandardMaterial({
    color: newThreeColour(color),
    wireframe,
    transparent,
    opacity,
    roughness,
    metalness,
    side
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




