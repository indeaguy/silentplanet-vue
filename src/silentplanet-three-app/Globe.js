import * as THREE from 'three';
import { configInstance } from './services/silentplanet-rust-geo';
import { createLineBasicMaterial, createSphericalGridLines, fadeMaterialColourByCameraDistance } from './make-these-libs/three-helpers'

export class Globe {
  constructor(worldStageModel) {
    this.worldStageModel = worldStageModel
    this.gridMaterials = {};

    // handle resize
    this.worldStageModel.addResizeObserver(this)
  }

  createGrids() {
    const allGridLines = {};
    this.gridMaterials = {};

    Object.entries(configInstance.settings.SPHERE.GRIDS).forEach(([key, gridConfig]) => {
      // Create grid lines
      const grid = createSphericalGridLines(
        configInstance.settings.SPHERE.RADIUS,
        gridConfig.LAT_DENSITY,
        gridConfig.LAT_DENSITY,
        gridConfig.LON_DENSITY,
        key
      );

      // Create material using the new function
      const material = createLineBasicMaterial(gridConfig.COLOR);

      // Apply material to grid lines
      grid.forEach(line => {
        line.material = material;
      });

      // Store grid lines and materials
      allGridLines[key] = grid;
      this.gridMaterials[key] = { material, config: gridConfig };
    });

    return allGridLines;
  }

  /**
   * Resize observer callback
   * @param {*} newSize 
   */
  onResize(newSize) {
    // Update any globe-specific properties that depend on size
  }

  render() {
    var cameraDistance = this.worldStageModel.camera.position.length()

    Object.values(this.gridMaterials).forEach(({ material, config }) => {
      fadeMaterialColourByCameraDistance(
        material,
        config.COLOR,
        config.COLOR_FINAL,
        cameraDistance,
        config.FADE_START * (configInstance.settings.CAMERA.MIN_ZOOM_DISTANCE + configInstance.settings.CAMERA.MAX_ZOOM_DISTANCE),
        config.FADE_END * (configInstance.settings.CAMERA.MIN_ZOOM_DISTANCE + configInstance.settings.CAMERA.MAX_ZOOM_DISTANCE),
        config.FADE_SPEED
      );
    })
  }
}
