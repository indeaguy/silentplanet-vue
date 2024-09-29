// Import main components
import { WorldStageController } from './modules/WorldStage';
import { createMeshModifier } from './modules/MeshModifier';
import { RayTracerController } from './modules/RayTracer';

// Import utility functions or classes if needed
// For example, if you have any utility functions in separate files, import them here

// Main export object
const ThreeWorldStage = {
  WorldStageController,
  createMeshModifier,
  RayTracerController,
  // Add any other exports here
};

// Named exports for individual components
export { WorldStageController, createMeshModifier, RayTracerController };

// Default export
export default ThreeWorldStage;