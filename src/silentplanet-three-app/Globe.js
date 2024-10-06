import { Grid } from './Grid.js'
// @TODO encapsulation problem here! This must aleady be initialized somewhere.
import configInstance from './Config.js';
// @TODO export these from a better place and rename to utilss
import { fadeMeshColourByCameraDistance, createSphere, removePoint } from './make-these-libs/three-helpers'

export class Globe {
  constructor(worldStageModel) {
    this.worldStageModel = worldStageModel
    this.gridMaterials = {}
    this.grid = new Grid(configInstance.settings.SPHERE.GRIDS)

    // handle resize
    this.worldStageModel.addResizeObserver(this)
  }

  createGrids() {
    return this.grid.createGrids();
  }

  /**
   * Resize observer callback
   * @param {*} newSize 
   */
  onResize(newSize) {
    // Update any globe-specific properties that depend on size
  }

  render() {
    // @TODO probably should use radius instead of min zoom distance
    var cameraDistance = this.worldStageModel.camera.position.length()

    Object.values(this.grid.gridMaterials).forEach(({ material, config }) => {
      fadeMeshColourByCameraDistance(
        { material },  // Wrap material in an object to simulate a mesh
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
