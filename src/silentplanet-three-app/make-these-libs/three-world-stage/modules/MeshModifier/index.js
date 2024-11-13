// Import necessary modules and helpers
import { MeshModifierModel } from './MeshModifierModel';
import { MeshModifierController } from './MeshModifierController';
import * as THREE from 'three';

// Export modules and helper functions
export {
  MeshModifierModel,
  MeshModifierController
};

/**
 * Creates and returns a MeshModifier instance with predefined states with colors or materials
 * @param {Object} stateProperties - An object containing state names and their corresponding colors or materials
 * @returns {MeshModifierController} The created MeshModifier controller
 * 
 * @example
 * // Using all default colors
 * const meshModifier1 = createMeshModifier();
 * 
 * // Overriding only the 'default' color
 * const meshModifier2 = createMeshModifier({ default: 0xf279a8 });
 * 
 * // Overriding multiple colors and using a THREE.Material
 * const meshModifier3 = createMeshModifier({
 *   default: 0xf279a8,
 *   event: new THREE.MeshBasicMaterial({ color: 0xffc0cb })
 * });
 */
export function createMeshModifier(stateProperties = {}) {
  const model = new MeshModifierModel();
  
  // Add states and colors/materials to the model
  Object.entries(stateProperties).forEach(([stateName, property]) => {
    model.addState(stateName);
    if (property instanceof THREE.Material) {
      model.addMaterialToState(stateName, property);
    } else {
      model.addColorToState(stateName, property);
    }
  });

  const controller = new MeshModifierController(model);
  return controller;
}
