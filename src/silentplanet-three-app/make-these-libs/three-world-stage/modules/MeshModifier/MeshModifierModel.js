import * as THREE from 'three';
import configInstance from '../../../../../silentplanet-three-app/Config.js';

export class MeshModifierModel {
  constructor(defaultColour, eventColour, selectedColour, selectedEventColour) {
    this.defaultColour = this.newColour(defaultColour, true);
    this.eventColour = this.newColour(eventColour, true);
    this.selectedColour = this.newColour(selectedColour, true);
    this.selectedEventColour = this.newColour(selectedEventColour, true);
    this.intersected = null;

    // Default values in case configInstance is not available
    this.minZoomDistance = 1;
    this.maxZoomDistance = 1000;

    try {
      const { CAMERA } = configInstance?.settings || {};
      if (CAMERA) {
        this.minZoomDistance = CAMERA.MIN_ZOOM_DISTANCE || this.minZoomDistance;
        this.maxZoomDistance = CAMERA.MAX_ZOOM_DISTANCE || this.maxZoomDistance;
      } else {
        console.warn('CAMERA settings not found in configInstance. Using default values.');
      }
    } catch (error) {
      console.error('Error accessing configInstance:', error);
      console.warn('Using default values for minZoomDistance and maxZoomDistance.');
    }
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

  calculateNormalizedDistance(distance, fadeStart, fadeEnd) {
    if (distance > fadeEnd) {
      return 1;
    } else if (distance < fadeStart) {
      return 0;
    } else {
      return (distance - fadeStart) / (fadeEnd - fadeStart);
    }
  }
}