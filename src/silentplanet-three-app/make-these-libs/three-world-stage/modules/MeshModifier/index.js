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
 * Creates and returns a MeshModifier instance
 * @param {number} defaultColour - Default color for meshes
 * @param {number} eventColour - Color for event-related meshes
 * @param {number} selectedColour - Color for selected meshes
 * @param {number} selectedEventColour - Color for selected event-related meshes
 * @returns {MeshModifierController} The created MeshModifier controller
 */
export function createMeshModifier(
  defaultColour = 0xf279a8,
  eventColour = 0xffc0cb,
  selectedColour = 0x0051e6,
  selectedEventColour = 0x005aff
) {
  const model = new MeshModifierModel(defaultColour, eventColour, selectedColour, selectedEventColour);
  const controller = new MeshModifierController(model);
  return controller;
}