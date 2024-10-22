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

/**
 * Create a LineBasicMaterial with the specified color.
 * 
 * @param {string|number} color - The color of the material (hex string or number).
 * @returns {THREE.LineBasicMaterial} The created LineBasicMaterial.
 */
export function createLineBasicMaterial(color = DEFAULT_COLOR) {
  return new THREE.LineBasicMaterial({
    color: newThreeColour(color)
  });
}

/**
 * Create a MeshPhongMaterial with the specified parameters.
 * 
 * @param {Object} options - Configuration options for the material.
 * @param {string|number} [options.color=DEFAULT_COLOR] - The color of the material (hex string or number).
 * @param {boolean} [options.wireframe=false] - Whether to display the material as a wireframe.
 * @param {boolean} [options.transparent=false] - Whether the material is transparent.
 * @param {number} [options.opacity=1] - The opacity of the material (0 to 1).
 * @param {THREE.Side} [options.side=THREE.DoubleSide] - Which side of the geometry to render.
 * @param {THREE.CubeTexture} [options.envMap=null] - The environment map to use for reflection.
 * @param {number} [options.shininess=100] - How shiny the material appears (0 to 100).
 * @param {string|number} [options.specular=0xffffff] - The color of specular highlights.
 * @param {number} [options.reflectivity=1] - The reflectivity of the material (0 to 1).
 * @param {THREE.MixOperation} [options.combine=THREE.MixOperation] - The combination operation for the material.
 * @param {THREE.Texture} [options.bumpMap=null] - The bump map to use for the material.
 * @returns {THREE.MeshPhongMaterial} The created MeshPhongMaterial.
 */
export function createMeshPhongMaterial({
  color = DEFAULT_COLOR,
  wireframe = false,
  transparent = false,
  opacity = 1,
  side = THREE.DoubleSide,
  envMap = null,
  shininess = 100,
  specular = 0xffffff,
  reflectivity = 1,
  combine = THREE.MixOperation,
  bumpMap = null,
  bumpScale = 1,
} = {}) {
  return new THREE.MeshPhongMaterial({
    color: newThreeColour(color),
    wireframe: wireframe,
    transparent: transparent,
    opacity: opacity,
    side: side,
    envMap: envMap,
    shininess: shininess,
    specular: newThreeColour(specular),
    reflectivity: reflectivity,
    combine: combine,
    bumpMap: bumpMap,
    bumpScale: bumpScale
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

// /**
//  * Create a MeshPhongMaterial with the specified parameters.
//  * 
//  * @param {Object} options - Configuration options for the material.
//  * @param {string} [options.name=''] - The name of the material.
//  * @param {string|number} [options.color=DEFAULT_COLOR] - The color of the material (hex string or number).
//  * @param {boolean} [options.wireframe=false] - Whether to display the material as a wireframe.
//  * @param {boolean} [options.transparent=false] - Whether the material is transparent.
//  * @param {number} [options.opacity=1] - The opacity of the material (0 to 1).
//  * @param {THREE.Side} [options.side=THREE.DoubleSide] - Which side of the geometry to render.
//  * @param {THREE.CubeTexture} [options.envMap=null] - The environment map to use for reflection.
//  * @param {number} [options.shininess=30] - How shiny the material appears (0 to 100).
//  * @param {string|number} [options.specular=0x111111] - The color of specular highlights.
//  * @param {number} [options.reflectivity=1] - The reflectivity of the material (0 to 1).
//  * @param {THREE.Combine} [options.combine=THREE.MultiplyOperation] - The combination operation for the material.
//  * @param {Object} [options.map] - The texture map options.
//  * @param {string} [options.map.url] - The URL of the texture map.
//  * @param {THREE.Mapping} [options.map.mapping=THREE.UVMapping] - The mapping mode of the texture.
//  * @param {number[]} [options.map.repeat=[1,1]] - The repeat factor for the texture map [x, y].
//  * @param {number[]} [options.map.offset=[0,0]] - The offset for the texture map [x, y].
//  * @param {number} [options.map.rotation=0] - The rotation for the texture map (in radians).
//  * @param {boolean} [options.map.flipY=true] - Whether to flip the texture map vertically.
//  * @param {boolean} [options.map.flipX=false] - Whether to flip the texture map horizontally.
//  * @param {Object} [options.bumpMap] - The bump map options (same properties as map).
//  * @param {number} [options.bumpScale=1] - The scale of the bump map.
//  * @param {Object} [options.normalMap] - The normal map options (same properties as map).
//  * @param {Vector2} [options.normalScale=new THREE.Vector2(1, 1)] - The scale of the normal map.
//  * @param {Object} [options.displacementMap] - The displacement map options (same properties as map).
//  * @param {number} [options.displacementScale=1] - The scale of the displacement map.
//  * @param {number} [options.displacementBias=0] - The bias of the displacement map.
//  * @param {Object} [options.specularMap] - The specular map options (same properties as map).
//  * @param {Object} [options.alphaMap] - The alpha map options (same properties as map).
//  * @param {Object} [options.emissiveMap] - The emissive map options (same properties as map).
//  * @param {string|number} [options.emissive=0x000000] - The emissive (light) color of the material.
//  * @param {number} [options.emissiveIntensity=1] - The intensity of the emissive light.
//  * @param {...otherProps} - Additional properties for the material.
//  * @returns {THREE.MeshPhongMaterial} The created MeshPhongMaterial.
//  */
// export function createMeshPhongMaterial({
//   name = '',
//   color = DEFAULT_COLOR,
//   wireframe = false,
//   transparent = false,
//   opacity = 1,
//   side = THREE.DoubleSide,
//   envMap = null,
//   shininess = 30,
//   specular = 0x111111,
//   reflectivity = 1,
//   combine = THREE.MultiplyOperation,
//   map = null,
//   bumpMap = null,
//   bumpScale = 1,
//   normalMap = null,
//   normalScale = new THREE.Vector2(1, 1),
//   displacementMap = null,
//   displacementScale = 1,
//   displacementBias = 0,
//   specularMap = null,
//   alphaMap = null,
//   emissiveMap = null,
//   emissive = 0x000000,
//   emissiveIntensity = 1,
//   ...otherProps
// } = {}) {
//   const material = new THREE.MeshPhongMaterial({
//     name: name,
//     color: newThreeColour(color),
//     wireframe: wireframe,
//     transparent: transparent,
//     opacity: opacity,
//     side: side,
//     envMap: envMap,
//     shininess: shininess,
//     specular: newThreeColour(specular),
//     reflectivity: reflectivity,
//     combine: combine,
//     bumpScale: bumpScale,
//     normalScale: normalScale,
//     displacementScale: displacementScale,
//     displacementBias: displacementBias,
//     emissive: newThreeColour(emissive),
//     emissiveIntensity: emissiveIntensity
//   });

//   //Helper function to set up texture maps
//   const setupMap = (mapOption, mapName) => {
//     if (mapOption && mapOption.url) {
//       const texture = new THREE.TextureLoader().load(mapOption.url);
//       texture.mapping = mapOption.mapping || THREE.UVMapping;
//       texture.repeat.set(...(mapOption.repeat || [1, 1]));
//       texture.offset.set(...(mapOption.offset || [0, 0]));
//       texture.rotation = mapOption.rotation || 0;
//       texture.flipY = mapOption.flipY !== undefined ? mapOption.flipY : true;
//       texture.flipX = mapOption.flipX || false;
//       material[mapName] = texture;
//     }
//   };

//   // Set up various maps
//   setupMap(map, 'map');
//   setupMap(bumpMap, 'bumpMap');
//   setupMap(normalMap, 'normalMap');
//   setupMap(displacementMap, 'displacementMap');
//   setupMap(specularMap, 'specularMap');
//   setupMap(alphaMap, 'alphaMap');
//   setupMap(emissiveMap, 'emissiveMap');

//   return material;
// }
