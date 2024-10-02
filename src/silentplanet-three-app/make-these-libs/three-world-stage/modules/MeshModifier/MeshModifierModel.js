import { newThreeColour } from './helpers/ThreeMeshHelpers';

export class MeshModifierModel {
  constructor(defaultColour, eventColour, selectedColour, selectedEventColour) {
    this.defaultColour = newThreeColour(defaultColour, true);
    this.eventColour = newThreeColour(eventColour, true);
    this.selectedColour = newThreeColour(selectedColour, true);
    this.selectedEventColour = newThreeColour(selectedEventColour, true);
    this.intersected = null;
  }

  setIntersected(mesh) {
    this.intersected = mesh;
  }

  resetIntersected() {
    this.intersected = null;
  }
}