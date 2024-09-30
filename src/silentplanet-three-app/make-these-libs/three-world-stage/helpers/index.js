import { WorldStageController } from '../modules/WorldStage';
import { createMeshModifier } from '../modules/MeshModifier';
import { RayTracerController } from '../modules/RayTracer';

// Import any other necessary modules or utilities

// Define helper methods that utilize the imported modules
const createWorldStage = (targetElement, config) => {
  return new WorldStageController(targetElement, config);
};

const modifyMesh = (mesh, modificationOptions) => {
  return createMeshModifier(mesh, modificationOptions);
};

const setupRayTracer = (scene, camera) => {
  return new RayTracerController(scene, camera);
};

// Add more helper methods as needed

// Export the helper methods
export {
  createWorldStage,
  modifyMesh,
  setupRayTracer,
  // Add other helper methods here
};

// You can also include a default export if desired
export default {
  createWorldStage,
  modifyMesh,
  setupRayTracer,
  // Add other helper methods here
};
