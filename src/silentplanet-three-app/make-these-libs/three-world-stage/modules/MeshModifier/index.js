// Import necessary modules and helpers
import { MeshModifierModel } from './MeshModifierModel';
import { MeshModifierController } from './MeshModifierController';
import {
  toggleMeshVisibility,
  createSphere,
  createBasicMeshBasicMaterial,
  createDebugMaterial,
  createMeshBasicMaterial,
  createStandardMeshMaterial
} from './helpers/ThreeMeshHelpers';

// Export modules and helper functions
export {
  MeshModifierModel,
  MeshModifierController,
  toggleMeshVisibility,
  createSphere,
  createBasicMeshBasicMaterial,
  createDebugMaterial,
  createMeshBasicMaterial,
  createStandardMeshMaterial
};

/**
 * Creates and returns a MeshModifier instance with predefined states and colors
 * @param {Object} stateColors - An object containing state names and their corresponding colors
 * @returns {MeshModifierController} The created MeshModifier controller
 * 
 * @example
 * const meshModifier = createMeshModifier({
 *   default: 0xf279a8,
 *   event: 0xffc0cb,
 *   selected: 0x0051e6,
 *   selectedEvent: 0x005aff
 * });
 */
export function createMeshModifier(stateColors = {
  default: 0xf279a8,
  event: 0xffc0cb,
  selected: 0x0051e6,
  selectedEvent: 0x005aff
}) {
  const model = new MeshModifierModel();
  
  // Add states and colors to the model
  Object.entries(stateColors).forEach(([stateName, color]) => {
    model.addState(stateName);
    model.addColorToState(stateName, color);
  });

  const controller = new MeshModifierController(model);
  return controller;
}