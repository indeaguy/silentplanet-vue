import * as THREE from 'three';

export class MeshModifierModel {
  constructor(defaultColour, eventColour, selectedColour, selectedEventColour) {
    this.defaultColour = this.newColour(defaultColour, true);
    this.eventColour = this.newColour(eventColour, true);
    this.selectedColour = this.newColour(selectedColour, true);
    this.selectedEventColour = this.newColour(selectedEventColour, true);
    this.intersected = null;
  }

  newColour(color, bypass = false) {
    if (!bypass && !this.isValidHexColour(color)) {
      return;
    }
    return new THREE.Color(color);
  }

  isValidHexColour(color) {
    return typeof color === 'string' && /^0x[0-9A-Fa-f]{6}$/.test(color);
  }

  setIntersected(mesh) {
    this.intersected = mesh;
  }

  resetIntersected() {
    this.intersected = null;
  }
}