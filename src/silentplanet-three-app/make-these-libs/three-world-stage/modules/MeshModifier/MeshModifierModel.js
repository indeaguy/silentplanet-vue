import * as THREE from 'three';
import configInstance from '../../../../../silentplanet-three-app/Config.js';

const PARSE_INT_AS_HEX = 16;

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
    if (bypass) {
      return new THREE.Color(color);
    }

    if (typeof color === 'string') {
      // Remove '#' if #RRGGBB format
      color = color.replace(/^#/, '');
      // Remove '0x' if 0xRRGGBB format
      color = color.replace(/^0x/, '');
      // Parse as hexadecimal
      const parsedColor = parseInt(color, PARSE_INT_AS_HEX);
      if (!isNaN(parsedColor) && parsedColor >= 0 && parsedColor <= 0xFFFFFF) {
        return new THREE.Color(parsedColor);
      }
    }
    console.warn(`Invalid color value: ${color}. Using default color.`);
    return new THREE.Color(0xFFFFFF); // Default to white
  }

  setIntersected(mesh) {
    this.intersected = mesh;
  }

  resetIntersected() {
    this.intersected = null;
  }
}