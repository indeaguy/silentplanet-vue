/**
 * Use like this:
 * import { createMeshModifier } from './silentplanet-three-app/MeshModifier';
 * ...
 * const meshModifier = createMeshModifier();
 */
import { MeshModifierModel } from './MeshModifierModel';
import { MeshModifierView, toggleMeshVisibility } from './MeshModifierView';
import { MeshModifierController } from './MeshModifierController';

export { MeshModifierModel, MeshModifierView, MeshModifierController, toggleMeshVisibility };

export function createMeshModifier(defaultColour = 0xf279a8, eventColour = 0xffc0cb, selectedColour = 0x0051e6, selectedEventColour = 0x005aff) {
  const model = new MeshModifierModel(defaultColour, eventColour, selectedColour, selectedEventColour);
  const view = new MeshModifierView();
  const controller = new MeshModifierController(model, view);
  return controller;
}