import * as THREE from 'three';
import { calculateNormalizedDistance } from './Camera';

const PARSE_INT_AS_HEX = 16;
const DEFAULT_COLOR = 0xFFFFFF;

// @TODO use least-recently-used (LRU) cache?
// @TODO expose this to pinia store?
const colorCache = new Map();

/**
 * Updates the mesh color
 * 
 * @param {THREE.Mesh} mesh 
 * @param {THREE.Color} colour 
 */
export function updateMeshColour(mesh, colour) {
    if (mesh && mesh.material && colour && colour instanceof THREE.Color) {
      mesh.material.color.set(colour);
    }
  }
  
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
   * @param {THREE.MeshMaterial} mesh 
   * @param {THREE.Color} fromColor 
   * @param {THREE.Color} toColor 
   * @param {number} cameraDistance 
   * @param {number} fadeMinDistance 
   * @param {number} fadeMaxDistance 
   * @param {number} fadeSpeed 
   * @returns {void}
   */
  export function fadeMaterialColourByCameraDistance(
    material, 
    fromColor, 
    toColor, 
    cameraDistance, 
    fadeMinDistance, 
    fadeMaxDistance, 
    fadeSpeed
  ) {
    if (!material || !fromColor || !toColor) {
      return;
    }
    const fromThreeColor = newThreeColour(fromColor);
    const toThreeColor = newThreeColour(toColor);
    const normalizedDistance = calculateNormalizedDistance(cameraDistance, fadeMinDistance, fadeMaxDistance);
    const color = new THREE.Color().lerpColors(fromThreeColor, toThreeColor, normalizedDistance);
    material.color.lerp(color, fadeSpeed);
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