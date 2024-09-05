import * as THREE from 'three';

export class RenderEffects {
  constructor(sceneRenderer) {
    this.sceneRenderer = sceneRenderer;
  }

  /**
   * Fades a material from one color to another over a distance from the camera.
   * @param {*} material Reference to the material to fade.
   * @param {*} config Reference to the original config object. 
   * @param {*} distance The distance from the camera to the object.
   */
  fadeGrid(material, config, distance) {
    let normalized;

    const fadeStart =
      config.FADE_START *
      (this.sceneRenderer.controls.minDistance + this.sceneRenderer.controls.maxDistance);
    const fadeEnd =
      config.FADE_END *
      (this.sceneRenderer.controls.minDistance + this.sceneRenderer.controls.maxDistance);
    
    if (distance > fadeEnd) {
      normalized = 1;
    } else if (distance < fadeStart) {
      normalized = 0;
    } else {
      normalized = (distance - fadeStart) / (fadeEnd - fadeStart);
    }

    var color1 = new THREE.Color(parseInt(config.COLOR_FINAL, 16)); // what it fades to
    var color2 = new THREE.Color(parseInt(config.COLOR, 16)); // what it fades from (config.COLOR);
    var color = color1.clone().lerp(color2, normalized);

    material.color.lerp(color, config.FADE_SPEED);
  }
}