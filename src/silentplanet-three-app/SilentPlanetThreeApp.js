import { configInstance } from './services/silentplanet-rust-geo';
import { getWorldStageController, createMeshModifier } from './make-these-libs/three-world-stage';
import { createLineBasicMaterial, createSphere, createSphericalGridLines, fadeMaterialColourByCameraDistance } from './make-these-libs/three-helpers'

export class SilentPlanetThree {
  constructor(worldStageModel, elementId = null) {
    this.worldStageModel = worldStageModel;
    this.gridMaterials = {};
    this.worldStageController = null;
    this.elementId = elementId;

    // handle resize
    this.worldStageModel.addResizeObserver(this)
  }

  async initialize() {

    let sphereMaterial, sphere, grids;

    await configInstance.initialize().catch(
      (error) => {
        console.error('Error initializing config:', error);
        throw error;
      }
    );

    this.worldStageController = getWorldStageController(this.elementId, configInstance);
    this.worldStageController.addResizeObserver(this);
    this.worldStage.model.renderables.push(this)

    sphereMaterial = createMeshBasicMaterial({
      color: configInstance.settings.SPHERE.FILL_COLOUR,
      wireframe: configInstance.settings.SPHERE.WIREFRAME,
      transparent: configInstance.settings.SPHERE.TRANSPARENT,
      opacity: configInstance.settings.SPHERE.OPACITY
    });
    sphere = createSphere({
      radius: configInstance.settings.SPHERE.RADIUS,
      widthSegments: configInstance.settings.SPHERE.WIDTH_SEGMENTS,
      heightSegments: configInstance.settings.SPHERE.HEIGHT_SEGMENTS,
      material: sphereMaterial
    });
    this.worldStageController.model.scene.add(sphere)

    grids = this.createGrids()
    Object.values(grids).forEach(gridArray => {
      gridArray.forEach(line => {
        this.worldStageController.model.scene.add(line)
      })
    })

  }

  // @TODO the only reason this is here is because it needs access to configInstance and this.gridMaterials
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
    //var cameraDistance = this.worldStageController.model.camera.position.length()
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
